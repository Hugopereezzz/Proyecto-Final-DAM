package com.example.demo;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "players")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String displayName;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String avatarBase64;

    private int credits = 0;
    private int wins = 0;
    private int xp = 0;
    private int healthLevel = 0;
    private int ammoLevel = 0;
    private int speedLevel = 0;
    private int alliedSupportCount = 0;

    @Column(nullable = false)
    private String missileSkin = "default";

    @Column(nullable = false)
    private String ownedSkins = "default";

    public User(String username, String password) {
        this.username = username;
        this.password = password;
        this.displayName = username;
        this.email = username + "@example.com"; // Default email for seeder/simple reg
    }
}
