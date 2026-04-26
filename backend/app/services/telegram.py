import logging
import aiohttp
from app.core.config import settings
from app.models.job import Job

logger = logging.getLogger(__name__)


async def send_job_notification(job: Job) -> bool:
    """Send job notification via Telegram."""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        logger.warning("Telegram credentials not configured")
        return False

    try:
        message = format_job_message(job)
        await send_telegram_message(message)
        return True
    except Exception as e:
        logger.error(f"Failed to send telegram notification: {str(e)}")
        return False


def format_job_message(job: Job) -> str:
    """Format job information for Telegram."""
    salary_info = ""
    if job.salary_min and job.salary_max:
        salary_info = f"\n💰 {job.salary_min:,} - {job.salary_max:,} {job.salary_currency}"
    elif job.salary_min:
        salary_info = f"\n💰 From {job.salary_min:,} {job.salary_currency}"

    contact_info = ""
    if job.email:
        contact_info += f"\n📧 {job.email}"
    if job.phone:
        contact_info += f"\n📞 {job.phone}"

    message = (
        f"🎯 <b>New Job Found!</b>\n\n"
        f"<b>{job.title}</b>\n"
        f"🏢 {job.company_id}\n"
        f"📍 {job.location}\n"
        f"🔷 {job.job_type.value}\n"
        f"🏷️ {job.domain}"
        f"{salary_info}"
        f"{contact_info}\n"
        f"🔗 <a href='{job.link}'>View Job</a>"
    )
    return message


async def send_telegram_message(message: str) -> bool:
    """Send message to Telegram chat."""
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    logger.info("Telegram message sent successfully")
                    return True
                else:
                    logger.error(f"Telegram API error: {response.status}")
                    return False
    except Exception as e:
        logger.error(f"Error sending telegram message: {str(e)}")
        return False
