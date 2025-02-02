using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Web_Genshin_API.Core;

namespace Web_Genshin_API.DataAccess;

public partial class GenshinContext : DbContext
{
    public GenshinContext()
    {
    }

    public GenshinContext(DbContextOptions<GenshinContext> options)
        : base(options)
    {
    }

    public virtual DbSet<FavoriteCharacter> FavoriteCharacters { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=genshin;Username=postgres;Password=2289");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FavoriteCharacter>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("favorite_characters_pkey");

            entity.ToTable("favorite_characters", "genshin");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CharacterName)
                .HasMaxLength(100)
                .HasColumnName("character_name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.FavoriteCharacters)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("favorite_characters_user_id_fkey");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");

            entity.ToTable("users", "genshin");

            entity.HasIndex(e => e.Username, "users_username_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Password).HasColumnName("password");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .HasColumnName("username");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
