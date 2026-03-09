namespace LeaveAPI.Models
{
    public class User
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        // "Manager" or "Employee"
        public string Role { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonIgnore]
        public ICollection<LeaveRequest>? LeaveRequests { get; set; }

        [System.Text.Json.Serialization.JsonIgnore]
        public ICollection<Notification>? Notifications { get; set; }
    }
}