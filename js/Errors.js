errors = {};

// These are equivalent of python exceptions, will log and raise alert in most cases - exceptions aren't caught
class ToBeImplementedError extends Error {
    constructor(message) {
        super("To be implemented: " + message);
        this.name = "ToBeImplementedError"
    }
}
errors.ToBeImplementedError = ToBeImplementedError;

class ObsoleteError extends Error {
    constructor(message) {
        super("Obsolete: " + message);
        this.name = "ObsoleteError"
    }
}
errors.ObsoleteError = ObsoleteError;

class TransportError extends Error {
    constructor(message) {
        super(message || "Transport failure");
        this.name = "TransportError"
    }
}
errors.TransportError = TransportError;

// Use this when the code logic has been broken - e.g. something is called with an undefined parameter, its preferable to console.assert
// Typically this is an error, that should have been caught higher up.
class CodingError extends Error {
    constructor(message) {
        super(message || "Coding Error");
        this.name = "CodingError"
    }
}
errors.CodingError = CodingError;

// Use this when the logic of encryption wont let you do something, typically something higher should have stopped you trying.
// Examples include signing something when you only have a public key.
class EncryptionError extends Error {
    constructor(message) {
        super(message || "Encryption Error");
        this.name = "EncryptionError"
    }
}
errors.EncryptionError = EncryptionError;

// Use this something that should have been signed isn't - this is externally signed, i.e. a data rather than coding error
class SigningError extends Error {
    constructor(message) {
        super(message || "Signing Error");
        this.name = "SigningError"
    }
}
errors.SigningError = SigningError;

class ForbiddenError extends Error {
    constructor(message) {
        super(message || "Forbidden failure");
        this.name = "ForbiddenError"
    }
}
errors.ForbiddenError = ForbiddenError;

class AuthenticationError extends Error {
    constructor(message) {
        super(message || "Authentication failure");
        this.name = "AuthenticationError"
    }
}
errors.AuthenticationError = AuthenticationError;

class IntentionallyUnimplementedError extends Error {
    constructor(message) {
        super(message || "Intentionally Unimplemented Function");
        this.name = "IntentionallyUnimplementedError"
    }
}
errors.IntentionallyUnimplementedError = IntentionallyUnimplementedError;

class DecryptionFailError extends Error {
    constructor(message) {
        super(message || "Decryption Failed");
        this.name = "DecryptionFailError"
    }
}
errors.DecryptionFailError = DecryptionFailError;

class SecurityWarning extends Error {
    constructor(message) {
        super(message || "Security Warning");
        this.name = "SecurityWarning"
    }
}
errors.SecurityWarning = SecurityWarning;

class ResolutionError extends Error {
    constructor(message) {
        super(message || "Resolution failure");
        this.name = "ResolutionError"
    }
}
errors.ResolutionError = ResolutionError;

exports = module.exports = errors;
