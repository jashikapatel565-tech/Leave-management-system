// ═══════════════════════════════════════════════════
//  Controllers/UserController.cs
//
//  Endpoints:
//    POST   /api/User              → Create user (for Swagger testing)
//    GET    /api/User              → Get all users (no passwords)
//    GET    /api/User/employees    → Get only employees (for manager tab)
//    POST   /api/User/Login        → Login, returns userId + role + name
//    POST   /api/User/AddEmployee  → Manager adds employee from dashboard
//
//  LoginRequest      → defined in Models/LoginRequest.cs
//  AddEmployeeRequest→ defined at the bottom of THIS file only
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

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // ── POST /api/User ──────────────────────────────────
        [HttpPost]
        public IActionResult CreateUser([FromBody] User user)
        {
            var existing = _context.Users.FirstOrDefault(u => u.Email == user.Email);
            if (existing != null)
                return Conflict(new { message = $"A user with email '{user.Email}' already exists." });

            _context.Users.Add(user);
            _context.SaveChanges();
            return Ok(user);
        }

        // ── GET /api/User ───────────────────────────────────
        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _context.Users
                .Select(u => new { u.Id, u.Name, u.Email, u.Role })
                .ToList();
            return Ok(users);
        }

        // ── GET /api/User/employees ─────────────────────────
        [HttpGet("employees")]
        public IActionResult GetEmployees()
        {
            var employees = _context.Users
                .Where(u => u.Role == "Employee")
                .Select(u => new { u.Id, u.Name, u.Email })
                .OrderBy(u => u.Name)
                .ToList();
            return Ok(employees);
        }

        // ── POST /api/User/Login ────────────────────────────
        [HttpPost("Login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var user = _context.Users.FirstOrDefault(
                u => u.Email == request.Email && u.Password == request.Password
            );

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

            var existing = _context.Users
                .FirstOrDefault(u => u.Email == request.Email.Trim().ToLower());
            if (existing != null)
                return Conflict(new { message = $"An account with email '{request.Email}' already exists." });

            var emp = new User
            {
                Name     = request.Name.Trim(),
                Email    = request.Email.Trim().ToLower(),
                Password = request.Password,
                Role     = "Employee"
            };

            _context.Users.Add(emp);
            _context.SaveChanges();

            _context.Notifications.Add(new Notification
            {
                UserId    = emp.Id,
                Message   = $"Welcome to LeaveFlow, {emp.Name}! " +
                            $"Your account has been created by the manager. " +
                            $"You can now log in and apply for leaves.",
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

    // AddEmployeeRequest is defined ONCE here only
    public class AddEmployeeRequest
    {
        public string Name     { get; set; } = string.Empty;
        public string Email    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}