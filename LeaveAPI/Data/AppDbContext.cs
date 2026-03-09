// ═══════════════════════════════════════════════════
//  Data/AppDbContext.cs
//  Entity Framework database context
//  Registers all 3 tables: Users, LeaveRequests, Notifications
// ═══════════════════════════════════════════════════
using Microsoft.EntityFrameworkCore;
using LeaveAPI.Models;

namespace LeaveAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        // Maps to the Users table in MySQL
        public DbSet<User> Users { get; set; }

        // Maps to the LeaveRequests table in MySQL
        public DbSet<LeaveRequest> LeaveRequests { get; set; }

        // Maps to the Notifications table in MySQL
        public DbSet<Notification> Notifications { get; set; }
    }
}