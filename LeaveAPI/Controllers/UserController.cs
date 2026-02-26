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

        [HttpPost]
        public IActionResult CreateUser([FromBody] User user)
        {
            // Check if email already exists
            var existing = _context.Users.FirstOrDefault(u => u.Email == user.Email);
            if (existing != null)
                return Conflict(new { message = $"A user with email '{user.Email}' already exists." });

            _context.Users.Add(user);
            _context.SaveChanges();
            return Ok(user);
        }

        [HttpGet]
        public IActionResult GetUsers()
        {
            return Ok(_context.Users.ToList());
        }

        [HttpPost("Login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var user = _context.Users
                .FirstOrDefault(u => u.Email == request.Email && u.Password == request.Password);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            return Ok(new
            {
                message = "Login successful",
                role = user.Role,
                userId = user.Id,
                name = user.Name,
                email = user.Email
            });
        }
    }
}