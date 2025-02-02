using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Web_Genshin_API.Core;
using Web_Genshin_API.DataAccess;

namespace Web_Genshin_API.WebHost.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController : Controller
    {
        private GenshinContext _context;
        private readonly ILogger<AuthController> _logger;
        public AuthController(GenshinContext context, ILogger<AuthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("/reg_token")]       
        public IActionResult Reg([FromBody] SignRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { error = "Empty username or password" });
            }
            var person = _context.Users.FirstOrDefault(x=> x.Username == request.Username);
            if (person != null)
            {
                return BadRequest(new { errorText = "Not unique username" });
            }
            var newUser = new User
            {
                Username = request.Username,
                Password = request.Password
            };
            _context.Users.Add(newUser);
            _context.SaveChanges();
            return Token(request.Username, request.Password);
        }

        [HttpPost("/sign_token")]
        public IActionResult Sign([FromBody] SignRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { error = "Empty username or password" });
            }

            return Token(request.Username, request.Password);
        }

        public class SignRequest
        {
            public string Username { get; set; }
            public string Password { get; set; }
        }
        public class CharacterRequest
        {
            public string Name { get; set; }
        }

        [Authorize]
        [HttpPost("/like")]
        public void Like([FromBody] CharacterRequest request)
        {
            var username = User.Identity.Name;
            var user = _context.Users.FirstOrDefault(x=> x.Username==username);
            var fav = new FavoriteCharacter
            {
                UserId = user.Id,
                CharacterName= request.Name
            };
            user.FavoriteCharacters.Add(fav);
            _context.FavoriteCharacters.Add(fav);
            _context.SaveChanges();
        }

        [Authorize]
        [HttpPost("/dislike")]
        public void Dislike([FromBody]CharacterRequest request)
        {
            var username = User.Identity.Name;
            var user = _context.Users.FirstOrDefault(x => x.Username == username);
            var fav = _context.FavoriteCharacters.FirstOrDefault(x => x.CharacterName== request.Name && x.UserId==user.Id);
            _context.FavoriteCharacters.Remove(fav);
            user.FavoriteCharacters.Remove(fav);
            _context.SaveChanges();
        }

        [Authorize]
        [HttpGet("/getCharacter")]
        public IActionResult GetCharacter()
        {
            var username = User.Identity.Name;
            var user = _context.Users.FirstOrDefault(x => x.Username == username);
            var favoriteCharacters = _context.FavoriteCharacters
            .Where(x => x.UserId == user.Id)
            .Select(x => x.CharacterName)
            .ToList();

            return Ok(favoriteCharacters);
        }

        [NonAction]
        public IActionResult Token(string username, string password)
        {
            var identity = GetIdentity(username, password);
            if (identity == null)
            {
                return BadRequest(new { errorText = "Invalid username or password." });
            }

            var now = DateTime.UtcNow;
            var jwt = new JwtSecurityToken(
                    issuer: AuthOptions.ISSUER,
                    audience: AuthOptions.AUDIENCE,
                    notBefore: now,
                    claims: identity.Claims,
                    expires: now.Add(TimeSpan.FromMinutes(AuthOptions.LIFETIME)),
                    signingCredentials: new SigningCredentials(AuthOptions.GetSymmetricSecurityKey(), SecurityAlgorithms.HmacSha256));
            var encodedJwt = new JwtSecurityTokenHandler().WriteToken(jwt);

            var response = new
            {
                access_token = encodedJwt,
                name = identity.Name
            };

            return Json(response);
        }
        private ClaimsIdentity GetIdentity(string username, string password)
        {
            var person = _context.Users.FirstOrDefault(x => x.Username == username && x.Password == password);
            if (person != null)
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimsIdentity.DefaultNameClaimType, person.Username.ToString()),
                    new Claim(ClaimsIdentity.DefaultRoleClaimType, "user")
                };
                ClaimsIdentity claimsIdentity =
                new ClaimsIdentity(claims, "Token", ClaimsIdentity.DefaultNameClaimType,
                    ClaimsIdentity.DefaultRoleClaimType);
                return claimsIdentity;
            }

            return null;
        }
    }
}
