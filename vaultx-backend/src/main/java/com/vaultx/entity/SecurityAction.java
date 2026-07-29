package com.vaultx.entity;

import com.vaultx.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Enum for various security-related actions.
 */
public enum SecurityAction {
    LOGIN,
    LOGOUT,
    PASSWORD_CHANGED,
    EMAIL_VERIFIED,
    PHONE_VERIFIED,
    PIN_CHANGED,
    PROFILE_UPDATED
}
