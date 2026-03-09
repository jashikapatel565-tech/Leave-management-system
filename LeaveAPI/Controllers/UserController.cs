// ═══════════════════════════════════════════════════
//  Controllers/UserController.cs — COMPLETE FINAL FIX
//
//  THE ROOT CAUSE WAS:
//  Frontend was sending raw form values (with possible
//  spaces/caps) to AddEmployee. Backend stored them as-is.
//  Login then compared normalised input vs un-normalised DB.
//
//  THE FIX:
//  1. Frontend now trims+lowercases before sending (App.js)
//  2. Backend ALSO trims+lowercases on receive (double safety)
//  3. Login normalises both sides before comparing
//  4. All comparisons done in C# memory (not MySQL)
// ═══════════════════════════════════════════════════
using Microsoft.AspNetCore.Mvc;
using LeaveAPI.Data;
using LeaveAPI.Models;

namespace LeaveAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        public UserController(AppDbContext context) { _context = context; }

        // ── POST /api/User ──────────────────────────────────
        [HttpPost]
        public IActionResult CreateUser([FromBody] User user)
        {
            var emailLower = user.Email.Trim().ToLower();
            if (_context.Users.ToList().Any(u => u.Email.Trim().ToLower() == emailLower))
                return Conflict(new { message = $"Email '{user.Email}' already exists." });
            user.Email = emailLower;
            _context.Users.Add(user);
            _context.SaveChanges();
            return Ok(user);
        }

        // ── GET /api/User ───────────────────────────────────
        [HttpGet]
        public IActionResult GetUsers()
        {
            return Ok(_context.Users
                .Select(u => new { u.Id, u.Name, u.Email, u.Role })
                .ToList());
        }

        // ── GET /api/User/employees ─────────────────────────
        [HttpGet("employees")]
        public IActionResult GetEmployees()
        {
            return Ok(_context.Users
                .Where(u => u.Role == "Employee")
                .Select(u => new { u.Id, u.Name, u.Email })
                .OrderBy(u => u.Name)
                .ToList());
        }

        // ── POST /api/User/Login ────────────────────────────
        [HttpPost("Login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
                return Unauthorized(new { message = "Email and password are required." });

            // Normalise input
            var emailNorm = request.Email.Trim().ToLower();
            var pwNorm    = request.Password.Trim();

            // Pull to C# memory — no MySQL collation issues
            var user = _context.Users
                .ToList()
                .FirstOrDefault(u =>
                    u.Email.Trim().ToLower() == emailNorm &&
                    u.Password.Trim()        == pwNorm);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            return Ok(new
            {
                message = "Login successful",
                role    = user.Role,
                userId  = user.Id,
                name    = user.Name,
                email   = user.Email
            });
        }

        // ── POST /api/User/AddEmployee ──────────────────────
        [HttpPost("AddEmployee")]
        public IActionResult AddEmployee([FromBody] AddEmployeeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Name is required." });
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });
            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Password is required." });

            // ✅ Normalise EVERYTHING on the backend side too (double safety)
            var nameTrim   = request.Name.Trim();
            var emailLower = request.Email.Trim().ToLower();
            var pwTrim     = request.Password.Trim();

            // Duplicate check in C#
            if (_context.Users.ToList().Any(u => u.Email.Trim().ToLower() == emailLower))
                return Conflict(new { message = $"An account with email '{emailLower}' already exists." });

            // Save with normalised values — guaranteed to match Login
            var emp = new User
            {
                Name     = nameTrim,
                Email    = emailLower,
                Password = pwTrim,
                Role     = "Employee"
            };
            _context.Users.Add(emp);
            _context.SaveChanges();

            _context.Notifications.Add(new Notification
            {
                UserId    = emp.Id,
                Message   = $"Welcome to LeaveFlow, {emp.Name}! " +
                            "Your account has been created by the manager. " +
                            "You can now log in and apply for leaves.",
                IsRead    = false,
                CreatedAt = DateTime.UtcNow
            });
            _context.SaveChanges();

            return Ok(new
            {
                message = $"Employee '{emp.Name}' added successfully.",
                id      = emp.Id,
                name    = emp.Name,
                email   = emp.Email
            });
        }
    }

    public class AddEmployeeRequest
    {
        public string Name     { get; set; } = string.Empty;
        public string Email    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}