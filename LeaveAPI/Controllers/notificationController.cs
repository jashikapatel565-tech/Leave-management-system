// ═══════════════════════════════════════════════════
//  Controllers/NotificationController.cs
//
//  Endpoints:
//    GET    /api/Notification/user/{userId}    → Get all notifications for a user (newest first)
//    PUT    /api/Notification/markread/{userId}→ Mark ALL of a user's notifications as read
//    DELETE /api/Notification/{id}             → Delete one notification
// ═══════════════════════════════════════════════════
using Microsoft.AspNetCore.Mvc;
using LeaveAPI.Data;
using LeaveAPI.Models;

namespace LeaveAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET /api/Notification/user/{userId} ─────────────
        // Called by the NotificationBell component every 10 seconds.
        // Returns newest notifications first so the bell badge count is accurate.
        [HttpGet("user/{userId}")]
        public IActionResult GetNotifications(int userId)
        {
            var notifications = _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToList();

            return Ok(notifications);
        }

        // ── PUT /api/Notification/markread/{userId} ─────────
        // Called when the user opens the bell dropdown.
        // Marks all their unread notifications as read in one go.
        [HttpPut("markread/{userId}")]
        public IActionResult MarkAllRead(int userId)
        {
            var unread = _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToList();

            foreach (var n in unread)
                n.IsRead = true;

            _context.SaveChanges();
            return Ok(new { message = $"Marked {unread.Count} notification(s) as read." });
        }

        // ── DELETE /api/Notification/{id} ───────────────────
        // Called when the user clicks the × button on a notification.
        // Permanently removes that single notification from the database.
        [HttpDelete("{id}")]
        public IActionResult DeleteNotification(int id)
        {
            var notification = _context.Notifications.Find(id);
            if (notification == null)
                return NotFound(new { message = $"Notification {id} not found." });

            _context.Notifications.Remove(notification);
            _context.SaveChanges();
            return Ok(new { message = "Notification deleted." });
        }
    }
}