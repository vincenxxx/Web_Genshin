using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace Web_Genshin_API.Core;

public partial class FavoriteCharacter
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string CharacterName { get; set; } = null!;

    [JsonIgnore]
    public virtual User User { get; set; } = null!;
}
