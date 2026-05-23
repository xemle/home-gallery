/**
 * @typedef {object} TAuthContext
 * @property {boolean} hasUsers
 * @property {boolean} allowAnonymous
 * @property {Record<string, TUser>} users
 * @property {TSessionStore} sessionStore
 * @property {function(import('express').Request): boolean} isAllowListed - Check if the request is allow-listed based on the client's IP address
 * @property {function(import('express').Request): boolean} setDefaultUser - Set the user in the request based on allow-list or anonymous access, returns true if user was set successfully
 *
 * @typedef {object} TSessionStore
 * @property {function(string, string[]): Promise<string>} createSession - Create a new session for a given username and roles, returns the session ID
 * @property {function(string): Promise<TSession | null>} getSession - Get session data by session ID, returns null if session does not exist or is expired
 * @property {function(string): Promise<void>} deleteSession - Delete a session by session ID
 *
 * @typedef {object} TSessionDataStore
 * @property {function(): Promise<{[sessionId: string]: TSession}>} read - Read all sessions from the store, returns an object mapping session IDs to session data
 * @property {function(Record<string, TSession>): Promise<void>} write - Write all sessions to the store, returns an object mapping session IDs to session data
 *
 * @typedef {object} TSession
 * @property {string} username - The username associated with the session
 * @property {string} created - The ISO string of the session creation time
 * @property {string} updated - The ISO string of the last session update time
 * @property {string} expires - The ISO string of the session expiration time
 *
 * @typedef {TUserConfigObject | string} TUserConfig
 *
 * @typedef {object} TUserConfigObject
 * @property {string} username - The username of the user
 * @property {string} [password] - The password or password hash definition
 * @property {string} [filter] - Optional filter for this user
 * @property {string[]} [roles] - Optional roles assigne  d to this user
 *
 * @typedef {object} TUser
 * @property {string} username - The username of the user
 * @property {function(string): boolean} testPassword - A function to test a password against the user's password
 * @property {string} [filter] - The database filter for the user
 * @property {string[]} roles - User roles
 * @property {TUserWebapp} [webapp] - The webapp configuration for the user
 *
 * @typedef {object} TUserWebapp
 * @property {string[]} [disabled] - The username of the user
 * @property {object} [pages] - The page settings
 * @property {object} [format] - User formats
 *
 * @typedef {object} TRoleConfig
 * @property {string} name - The name of the role
 * @property {string} [filter] - The database filter for the role
 * @property {string[]} [roles] - The roles assigned to this role (for role inheritance)
 * @property {object} [webapp] - The webapp configuration for the role
 *
 * @typedef {object} TRule
 * @property {'allow' | 'deny'} type - The name of the rule
 * @property {string} value - The database filter for the rule
 *
 * @typedef {object} TNetworkRule
 * @property {'allow' | 'deny'} type - The name of the rule
 * @property {string} value - The database filter for the rule
 * @property {number} networkPrefix - The network prefix for the rule
 * @property {number} networkMask - The network mask for the rule
 *
 */
