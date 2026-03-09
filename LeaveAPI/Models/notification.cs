// ═══════════════════════════════════════════════════
//  Models/Notification.cs
//  The Notifications table
// ═══════════════════════════════════════════════════
namespace LeaveAPI.Models
{
    public class Notification
    {
        public int Id { get; set; }

        // Foreign key → Users.Id  (who receives this notification)
        public int UserId { get; set; }

        public string Message { get; set; } = string.Empty;

        // false = unread (shows red badge),  true = read (dimmed in dropdown)
        public bool IsRead { get; set; } = false;

        // Set automatically to UTC time when created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property — hidden from JSON
        [System.Text.Json.Serialization.JsonIgnore]
        public User? User { get; set; }
    }
}