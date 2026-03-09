// ═══════════════════════════════════════════════════
//  Controllers/LeaveRequestController.cs
//
//  Endpoints:
//    POST  /api/LeaveRequest/Create      → Employee submits a leave request
//                                          → Notifies all managers automatically
//    GET   /api/LeaveRequest             → Manager gets ALL leave requests (with user info)
//    GET   /api/LeaveRequest/user/{id}   → Employee gets their own requests
//    PUT   /api/LeaveRequest/{id}        → Manager approves / rejects
//                                          → Notifies the employee automatically
// ═══════════════════════════════════════════════════
using Microsoft.AspNetCore.Mvc;
using LeaveAPI.Data;
using LeaveAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LeaveAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaveRequestController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveRequestController(AppDbContext context)
        {
            _context = context;
        }

        // ── POST /api/LeaveRequest/Create ───────────────────
        // Employee submits a leave request.
        // Status is ALWAYS forced to "Pending" — employee cannot set their own status.
        // After saving, a notification is pushed to every manager in the system.
        [HttpPost("Create")]
        public IActionResult CreateLeave([FromBody] LeaveRequest request)
        {
            // Validate that a userId was provided
            if (request.UserId == 0)
                return BadRequest(new { message = "UserId is required." });

            // Make sure the user actually exists
            var employee = _context.Users.Find(request.UserId);
            if (employee == null)
                return BadRequest(new { message = $"User with Id {request.UserId} does not exist." });

            // Force safe defaults — employee cannot manipulate status
            request.Status        = "Pending";
            request.ManagerRemark = "";

            _context.LeaveRequests.Add(request);
            _context.SaveChanges();

            // ── Notify every manager ──────────────────────────
            var managers = _context.Users
                .Where(u => u.Role == "Manager")
                .ToList();

            foreach (var manager in managers)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId    = manager.Id,
                    Message   = $"{employee.Name} has applied for {request.LeaveType} leave " +
                                $"from {request.StartDate:dd MMM yyyy} to {request.EndDate:dd MMM yyyy}.",
                    IsRead    = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
            _context.SaveChanges();

            return Ok(request);
        }

        // ── GET /api/LeaveRequest ───────────────────────────
        // Returns ALL leave requests joined with the user's name and email.
        // Used by the Manager Dashboard.
        [HttpGet]
        public IActionResult GetAllLeaves()
        {
            var leaves = _context.LeaveRequests
                .Include(l => l.User)
                .Select(l => new
                {
                    l.Id,
                    l.UserId,
                    UserName  = l.User != null ? l.User.Name  : "Unknown",
                    UserEmail = l.User != null ? l.User.Email : "",
                    l.LeaveType,
                    l.StartDate,
                    l.EndDate,
                    l.Reason,
                    l.Status,
                    l.ManagerRemark
                })
                .OrderByDescending(l => l.Id)   // newest first
                .ToList();

            return Ok(leaves);
        }

        // ── GET /api/LeaveRequest/user/{userId} ─────────────
        // Returns only the leaves for one specific employee.
        // Used by the Employee Dashboard.
        [HttpGet("user/{userId}")]
        public IActionResult GetLeavesByUser(int userId)
        {
            var leaves = _context.LeaveRequests
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.Id)
                .ToList();

            return Ok(leaves);
        }

        // ── PUT /api/LeaveRequest/{id} ──────────────────────
        // Manager approves or rejects a request.
        // After saving, a notification is pushed to the employee with the decision + remark.
        [HttpPut("{id}")]
        public IActionResult UpdateStatus(int id, [FromBody] UpdateStatusRequest updated)
        {
            var leave = _context.LeaveRequests.Find(id);
            if (leave == null)
                return NotFound(new { message = $"Leave request {id} not found." });

            // Update the record
            leave.Status        = updated.Status;
            leave.ManagerRemark = updated.ManagerRemark ?? "";
            _context.SaveChanges();

            // ── Notify the employee ──────────────────────────
            // Build the remark part of the message (only shown if remark was provided)
            var remarkPart = string.IsNullOrWhiteSpace(updated.ManagerRemark)
                ? ""
                : $" Remark: \"{updated.ManagerRemark}\"";

            _context.Notifications.Add(new Notification
            {
                UserId    = leave.UserId,
                Message   = $"Your {leave.LeaveType} leave request " +
                            $"({leave.StartDate:dd MMM yyyy} – {leave.EndDate:dd MMM yyyy}) " +
                            $"has been {updated.Status}.{remarkPart}",
                IsRead    = false,
                CreatedAt = DateTime.UtcNow
            });
            _context.SaveChanges();

            return Ok(leave);
        }
    }
}