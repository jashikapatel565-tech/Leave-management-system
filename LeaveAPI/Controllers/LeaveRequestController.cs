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

        [HttpPost("Create")]
        public IActionResult CreateLeave([FromBody] LeaveRequest request)
        {
            if (request.UserId == 0)
                return BadRequest(new { message = "UserId is required." });

            var userExists = _context.Users.Any(u => u.Id == request.UserId);
            if (!userExists)
                return BadRequest(new { message = $"User with Id {request.UserId} does not exist." });

            request.Status = "Pending";
            request.ManagerRemark = "";
            _context.LeaveRequests.Add(request);
            _context.SaveChanges();
            return Ok(request);
        }

        [HttpGet]
        public IActionResult GetAllLeaves()
        {
            var leaves = _context.LeaveRequests
                .Include(l => l.User)
                .Select(l => new
                {
                    l.Id,
                    l.UserId,
                    UserName = l.User != null ? l.User.Name : "Unknown",
                    UserEmail = l.User != null ? l.User.Email : "",
                    l.LeaveType,
                    l.StartDate,
                    l.EndDate,
                    l.Reason,
                    l.Status,
                    l.ManagerRemark
                })
                .OrderByDescending(l => l.Id)
                .ToList();

            return Ok(leaves);
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetLeavesByUser(int userId)
        {
            var leaves = _context.LeaveRequests
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.Id)
                .ToList();
            return Ok(leaves);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateStatus(int id, [FromBody] UpdateStatusRequest updated)
        {
            var leave = _context.LeaveRequests.Find(id);
            if (leave == null)
                return NotFound(new { message = $"Leave request with Id {id} not found." });

            leave.Status = updated.Status;
            leave.ManagerRemark = updated.ManagerRemark ?? "";
            _context.SaveChanges();
            return Ok(leave);
        }
    }
}