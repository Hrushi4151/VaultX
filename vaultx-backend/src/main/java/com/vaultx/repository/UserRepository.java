package com.vaultx.repository;

import com.vaultx.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") UUID id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE LOWER(u.email) = LOWER(:id) OR LOWER(u.username) = LOWER(:id) OR u.phoneNumber = :id")
    Optional<User> findByIdentifierWithRoles(@Param("id") String identifier);
    
    Page<User> findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(String email, String username, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE " +
           "(:status = 'ALL' OR " +
           "  (:status = 'ACTIVE' AND u.active = true AND u.deleted = false) OR " +
           "  (:status = 'SUSPENDED' AND u.active = false AND u.deleted = false) OR " +
           "  (:status = 'DELETED' AND u.deleted = true)) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsersWithStatus(@Param("search") String search, @Param("status") String status, Pageable pageable);
    
    long countByActive(boolean active);
}
