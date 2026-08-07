package org.example.db;

public class DatabaseConfig {
    public static final String DEV_DB_FILENAME = "aresta_dev.db";
    public static final String PROD_DB_FILENAME = "aresta_prod.db";

    private final boolean debug;
    private final String databaseFilename;

    public DatabaseConfig(boolean debug) {
        this.debug = debug;
        this.databaseFilename = debug ? DEV_DB_FILENAME : PROD_DB_FILENAME;
    }

    public static DatabaseConfig fromEnvironment() {
        String debugProperty = System.getProperty("app.debug");
        String debugEnv = System.getenv("APP_DEBUG");

        boolean isDebug = true; // default to debug/dev if unspecified
        if (debugProperty != null) {
            isDebug = Boolean.parseBoolean(debugProperty);
        } else if (debugEnv != null) {
            isDebug = Boolean.parseBoolean(debugEnv);
        }

        return new DatabaseConfig(isDebug);
    }

    public boolean isDebug() {
        return debug;
    }

    public String getDatabaseFilename() {
        return databaseFilename;
    }

    public String getDatabaseUrl() {
        return "jdbc:sqlite:" + databaseFilename;
    }
}
