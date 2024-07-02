package edu.whu.MagicNote.security;

import edu.whu.MagicNote.property.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * 解析和验证JWT令牌的工具类
 */
@Component
public class JwtTokenUtil {
    @Autowired
    private JwtProperties jwtProperties;

    //生成Token
    public String generateToken(Map<String, Object> claims) {
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtProperties.getTtl()))
                .signWith(SignatureAlgorithm.HS512, jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8))
                .compact();
    }
    //解析Token获得Claims
    public Claims getClaimFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8))
                .parseClaimsJws(token).getBody();
    }
    //对Token进行验证
    public Boolean validateToken(String token, UserDetails userDetails) {
        Claims claim = getClaimFromToken(token);
        return userDetails != null &&
                claim.getSubject().equals(userDetails.getUsername())
                && !claim.getExpiration().before(new Date());
    }
    //辅助方法
    public Boolean canTokenBeRefreshed(String token) {
        return (!isTokenExpired(token) || ignoreTokenExpiration(token));
    }
    public Boolean isTokenExpired(String token) {
        Claims claim = getClaimFromToken(token);
        return claim.getExpiration().before(new Date());
    }
    private Boolean ignoreTokenExpiration(String token) {
        // here you specify tokens, for that the expiration is ignored
        return false;
    }
}
