package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/leaderboard")
@CrossOrigin(origins = "*")
public class LeaderboardController {

    @Autowired
    private UserRepository userRepository;

    public static class WinRequest {
        public String username;
    }

    public static class PayoutRequest {
        public String username;
        public int buildingsDestroyed;
    }

    @GetMapping
    public ResponseEntity<List<User>> getTopPlayers() {
        return ResponseEntity.ok(userRepository.findTop10ByOrderByWinsDesc());
    }

    @PostMapping("/win")
    public ResponseEntity<?> addWin(@RequestBody WinRequest request) {
        if (request.username == null) return ResponseEntity.badRequest().build();
        
        Optional<User> user = userRepository.findByUsername(request.username);
        if (user.isPresent()) {
            User u = user.get();
            u.setWins(u.getWins() + 1);
            u.setCredits(u.getCredits() + 100);
            u.setXp(u.getXp() + 250); 
            userRepository.save(u);
            return ResponseEntity.ok(u);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/payout")
    public ResponseEntity<?> addPayout(@RequestBody PayoutRequest request) {
        if (request.username == null) return ResponseEntity.badRequest().build();
        
        Optional<User> user = userRepository.findByUsername(request.username);
        if (user.isPresent()) {
            User u = user.get();
            u.setCredits(u.getCredits() + request.buildingsDestroyed);
            u.setXp(u.getXp() + (request.buildingsDestroyed * 10)); 
            userRepository.save(u);
            return ResponseEntity.ok(u);
        }
        return ResponseEntity.notFound().build();
    }
}
