using System;
using System.Collections.Generic;

namespace Web_Genshin_API.Core;

public partial class User
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public string Password { get; set; } = null!;

    public virtual ICollection<FavoriteCharacter> FavoriteCharacters { get; set; } = new List<FavoriteCharacter>();
}
