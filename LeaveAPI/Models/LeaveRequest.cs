namespace LeaveAPI.Models
{
    public class LeaveRequest
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string LeaveType { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending";

        public string ManagerRemark { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonIgnore]
        public User? User { get; set; }
    }

    // Separate DTO for updating status — avoids sending full model
    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? ManagerRemark { get; set; }
    }
}