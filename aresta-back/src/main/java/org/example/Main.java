package org.example;

import com.auth0.jwt.interfaces.DecodedJWT;
import io.javalin.Javalin;
import io.javalin.http.ForbiddenResponse;
import io.javalin.http.UnauthorizedResponse;
import org.example.config.DatabaseConfig;
import org.example.controller.AuthController;
import org.example.controller.BookController;
import org.example.controller.GraphController;
import org.example.controller.UserBookController;
import org.example.controller.UserController;
import org.example.db.DatabaseManager;
import org.example.model.User;
import org.example.repository.AppConfigRepository;
import org.example.repository.BookRepository;
import org.example.repository.GraphRepository;
import org.example.repository.JdbcAppConfigRepository;
import org.example.repository.JdbcBookRepository;
import org.example.repository.JdbcGraphRepository;
import org.example.repository.JdbcUserBookRepository;
import org.example.repository.JdbcUserRepository;
import org.example.repository.UserBookRepository;
import org.example.repository.UserRepository;
import org.example.security.JwtUtil;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);
    private static final int PORT = 7070;
    private static final String ADMIN_NAME = "viktor";
    private static final String ADMIN_PASS = "orlaweb123123#";

    public static void main(String[] args) {
        logger.info("Iniciando Aresta Backend Server com Autenticação e Segurança...");

        DatabaseConfig config = DatabaseConfig.fromEnvironment();
        logger.info("Modo Debug: {}, Banco: {}", config.isDebug(), config.getDatabasePath());

        DatabaseManager dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        UserRepository userRepository = new JdbcUserRepository(dbManager.getDataSource());
        AppConfigRepository configRepository = new JdbcAppConfigRepository(dbManager.getDataSource());

        ensureAdminAccount(userRepository);

        Javalin app = Javalin.create(javalinConfig -> {
            javalinConfig.bundledPlugins.enableCors(cors -> cors.addRule(corsRule -> corsRule.anyHost()));
            javalinConfig.staticFiles.add(staticFiles -> {
                staticFiles.hostedPath = "/covers";
                staticFiles.directory = "storage/covers";
                staticFiles.location = io.javalin.http.staticfiles.Location.EXTERNAL;
            });
        });

        registerRoutes(app, dbManager, userRepository, configRepository, config);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("Encerrando servidor Javalin e pool de conexões...");
            app.stop();
            dbManager.close();
        }));

        app.start(PORT);
        logger.info("Servidor Javalin rodando com sucesso em http://localhost:{}", PORT);
    }

    private static void ensureAdminAccount(UserRepository userRepository) {
        userRepository.findByEmailOrName(ADMIN_NAME).ifPresentOrElse(
            user -> {
                boolean matches = false;
                try {
                    matches = user.passwordHash() != null && BCrypt.checkpw(ADMIN_PASS, user.passwordHash());
                } catch (Exception e) {
                    logger.warn("Hash de senha inválido para 'viktor', regerando...");
                }
                if (!matches) {
                    String newHash = BCrypt.hashpw(ADMIN_PASS, BCrypt.gensalt());
                    User updated = new User(user.id(), user.name(), user.email(), newHash, "ADMIN", true, user.createdAt(), null);
                    userRepository.update(user.id(), updated);
                    logger.info("Senha da conta 'viktor' atualizada.");
                }
            },
            () -> {
                String hash = BCrypt.hashpw(ADMIN_PASS, BCrypt.gensalt());
                userRepository.save(new User(ADMIN_NAME, "viktor@aresta.org", hash, "ADMIN", true));
                logger.info("Conta Admin 'viktor' criada.");
            }
        );
    }

    private static void registerRoutes(Javalin app, DatabaseManager dbManager, UserRepository userRepo,
                                       AppConfigRepository configRepo, DatabaseConfig config) {
        UserController userController = new UserController(userRepo);
        AuthController authController = new AuthController(userRepo);

        BookRepository bookRepository = new JdbcBookRepository(dbManager.getDataSource());
        BookController bookController = new BookController(bookRepository);

        UserBookRepository userBookRepo = new JdbcUserBookRepository(dbManager.getDataSource());
        UserBookController userBookController = new UserBookController(userBookRepo);

        GraphRepository graphRepo = new JdbcGraphRepository(dbManager.getDataSource());
        GraphController graphController = new GraphController(graphRepo);

        app.post("/api/auth/login", authController::login);
        app.get("/api/auth/me", authController::me);
        app.get("/api/health", ctx -> {
            String dbVersion = configRepo.getValue("version").orElse("1.0.0");
            ctx.json(Map.of("status", "UP", "database", config.getDatabasePath(), "schemaVersion", dbVersion));
        });

        app.get("/api/books", bookController::getAll);
        app.get("/api/books/{id}", bookController::getById);
        app.get("/api/books/{id}/cover", bookController::getCover);
        app.get("/api/books/{id}/file", bookController::getFile);
        app.post("/api/books", bookController::create);
        app.delete("/api/books/{id}", bookController::delete);

        app.get("/api/user-books", userBookController::getUserBooks);
        app.post("/api/user-books", userBookController::addUserBook);
        app.patch("/api/user-books/{id}", userBookController::updateUserBook);
        app.delete("/api/user-books/{id}", userBookController::deleteUserBook);
        app.delete("/api/user-books/book/{bookId}", userBookController::deleteUserBookByBookId);

        app.get("/api/graph", graphController::getGraph);
        app.post("/api/graph/nodes", graphController::createNode);
        app.put("/api/graph/nodes/{id}", graphController::updateNode);
        app.delete("/api/graph/nodes/{id}", graphController::deleteNode);
        app.post("/api/graph/connections", graphController::createConnection);
        app.delete("/api/graph/connections/{sourceId}/{targetId}", graphController::deleteConnection);
        app.post("/api/graph/nodes/{id}/books", graphController::linkBookToNode);
        app.delete("/api/graph/nodes/{id}/books/{userBookId}", graphController::unlinkBookFromNode);

        app.before("/api/users*", ctx -> {
            if ("OPTIONS".equalsIgnoreCase(ctx.method().name())) return;
            String authHeader = ctx.header("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new UnauthorizedResponse("Acesso negado. Token não informado.");
            }
            String token = authHeader.substring(7);
            Optional<DecodedJWT> jwtOpt = JwtUtil.verifyToken(token);
            if (jwtOpt.isEmpty()) throw new UnauthorizedResponse("Token inválido.");
            DecodedJWT jwt = jwtOpt.get();
            if (!"ADMIN".equalsIgnoreCase(jwt.getClaim("role").asString())) {
                throw new ForbiddenResponse("Acesso negado. Apenas administradores.");
            }
        });

        app.get("/api/users", userController::getAll);
        app.get("/api/users/{id}", userController::getById);
        app.post("/api/users", userController::create);
        app.put("/api/users/{id}", userController::update);
        app.delete("/api/users/{id}", userController::delete);
    }
}
