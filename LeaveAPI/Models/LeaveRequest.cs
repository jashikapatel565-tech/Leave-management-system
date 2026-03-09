// ═══════════════════════════════════════════════════
//  Models/LeaveRequest.cs
//  The LeaveRequests table + UpdateStatusRequest DTO
// ═══════════════════════════════════════════════════
namespace LeaveAPI.Models
{
    public class LeaveRequest
    {
        public int Id { get; set; }

        // Foreign key → Users.Id
        public int UserId { get; set; }

        // "Annual" | "Sick" | "Casual" | "Maternity" | "Paternity" | "Emergency"
        public string LeaveType { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Reason { get; set; } = string.Empty;

        // "Pending" | "Approved" | "Rejected"  — always starts as "Pending"
        public string Status { get; set; } = "Pending";

        // Manager fills this when approving / rejecting
        public string ManagerRemark { get; set; } = string.Empty;

        // Navigation property — hidden from JSON to avoid circular reference
        [System.Text.Json.Serialization.JsonIgnore]
        public User? User { get; set; }
    }

    // DTO used only by PUT /api/LeaveRequest/{id}
    public class UpdateStatusRequest
    {
        public string  Status        { get; set; } = string.Empty;
        public string? ManagerRemark { get; set; }
    }
}