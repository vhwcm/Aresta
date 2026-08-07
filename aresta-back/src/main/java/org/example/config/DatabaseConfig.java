package org.example.config;

public class DatabaseConfig {
    public static final String DEV_DB_FILENAME = "aresta_dev.db";
    public static final String PROD_DB_FILENAME = "aresta_prod.db";

    private final boolean debug;
    private final String databasePath;
    private final int maxPoolSize;

    public DatabaseConfig(boolean debug) {
        this(debug, debug ? DEV_DB_FILENAME : PROD_DB_FILENAME, 5);
    }

    public DatabaseConfig(boolean debug, String databasePath, int maxPoolSize) {
        this.debug = debug;
        this.databasePath = databasePath;
        this.maxPoolSize = maxPoolSize;
    }

    public static DatabaseConfig fromEnvironment() {
        String debugProperty = System.getProperty("app.debug");
        String debugEnv = System.getenv("APP_DEBUG");

        boolean isDebug = true;
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

    public String getDatabasePath() {
        return databasePath;
    }

    public String getJdbcUrl() {
        return "jdbc:sqlite:" + databasePath;
    }

    public int getMaxPoolSize() {
        return maxPoolSize;
    }
}
