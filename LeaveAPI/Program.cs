// ═══════════════════════════════════════════════════
//  Program.cs
//  Application entry point — configures all services
//
//  Key things this file does:
//    1. Registers the database context (MySQL via Pomelo)
//    2. Sets up CORS so React (localhost:3000) can call the API
//    3. Prevents JSON circular reference errors
//    4. Returns all JSON keys in camelCase (matches React expectations)
//    5. Enables Swagger UI for testing endpoints
// ═══════════════════════════════════════════════════
using LeaveAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── 1. Controllers + JSON settings ──────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Prevents crash when LeaveRequest.User → User.LeaveRequests loops
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;

        // Returns "userId" not "UserId" — matches React's camelCase expectations
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ── 2. Swagger ───────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── 3. CORS — allow React dev server ────────────────
// Add your production frontend URL here when deploying
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000"          // React dev server
                // "https://your-app.onrender.com"  // ← uncomment when deploying
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ── 4. MySQL Database via Pomelo ─────────────────────
// Connection string is in appsettings.json → "DefaultConnection"
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

var app = builder.Build();

// ── 5. Middleware pipeline ───────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();  // available at http://localhost:5123/swagger
}

// CORS must come before UseAuthorization and MapControllers
app.UseCors("AllowReact");
app.UseAuthorization();
app.MapControllers();

app.Run();