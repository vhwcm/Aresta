package org.example;

import com.auth0.jwt.interfaces.DecodedJWT;
import io.javalin.Javalin;
import io.javalin.http.ForbiddenResponse;
import io.javalin.http.UnauthorizedResponse;
import org.example.config.DatabaseConfig;
import org.example.controller.AuthController;
import org.example.controller.UserController;
import org.example.db.DatabaseManager;
import org.example.repository.AppConfigRepository;
import org.example.repository.JdbcAppConfigRepository;
import org.example.repository.JdbcUserRepository;
import org.example.repository.UserRepository;
import org.example.security.JwtUtil;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);
    private static final int PORT = 7070;

    public static void main(String[] args) {
        logger.info("Iniciando Aresta Backend Server com Autenticação e Segurança...");

        // 1. Resolver configurações do banco
        DatabaseConfig config = DatabaseConfig.fromEnvironment();
        logger.info("Modo Debug: {}", config.isDebug());
        logger.info("Banco Selecionado: {}", config.getDatabasePath());

        // 2. Inicializar banco e Flyway migrations
        DatabaseManager dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        // 3. Instanciar Repositórios e Controllers
        UserRepository userRepository = new JdbcUserRepository(dbManager.getDataSource());
        AppConfigRepository configRepository = new JdbcAppConfigRepository(dbManager.getDataSource());

        // Garantir que a conta Admin viktor exista com a senha orlaweb123123#
        userRepository.findByEmailOrName("viktor").ifPresentOrElse(
            user -> {
                logger.info("Conta Admin 'viktor' encontrada (ID={})", user.id());
                boolean matches = false;
                try {
                    matches = user.passwordHash() != null && BCrypt.checkpw("orlaweb123123#", user.passwordHash());
                } catch (Exception e) {
                    logger.warn("Hash de senha inválido detectado para 'viktor', regerando hash...");
                }
                if (!matches) {
                    String newHash = BCrypt.hashpw("orlaweb123123#", BCrypt.gensalt());
                    userRepository.update(user.id(), new org.example.model.User(user.id(), user.name(), user.email(), newHash, "ADMIN", true, user.createdAt(), null));
                    logger.info("Senha da conta 'viktor' atualizada para 'orlaweb123123#'");
                }
            },
            () -> {
                String hash = BCrypt.hashpw("orlaweb123123#", BCrypt.gensalt());
                userRepository.save(new org.example.model.User("viktor", "viktor@aresta.org", hash, "ADMIN", true));
                logger.info("Conta Admin 'viktor' criada com sucesso");
            }
        );

        UserController userController = new UserController(userRepository);
        AuthController authController = new AuthController(userRepository);

        org.example.repository.BookRepository bookRepository = new org.example.repository.JdbcBookRepository(dbManager.getDataSource());
        org.example.controller.BookController bookController = new org.example.controller.BookController(bookRepository);

        // 4. Iniciar Javalin REST Server com CORS liberado
        Javalin app = Javalin.create(javalinConfig -> {
            javalinConfig.bundledPlugins.enableCors(cors -> {
                cors.addRule(corsRule -> corsRule.anyHost());
            });
            javalinConfig.staticFiles.add(staticFiles -> {
                staticFiles.hostedPath = "/covers";
                staticFiles.directory = "storage/covers";
                staticFiles.location = io.javalin.http.staticfiles.Location.EXTERNAL;
            });
        });

        // Rotas Públicas
        app.post("/api/auth/login", authController::login);
        app.get("/api/auth/me", authController::me);
        app.get("/api/health", ctx -> {
            String dbVersion = configRepository.getValue("version").orElse("1.0.0");
            ctx.json(java.util.Map.of(
                "status", "UP",
                "database", config.getDatabasePath(),
                "schemaVersion", dbVersion
            ));
        });

        // Rotas de Livros
        app.get("/api/books", bookController::getAll);
        app.get("/api/books/{id}", bookController::getById);
        app.get("/api/books/{id}/cover", bookController::getCover);
        app.post("/api/books", bookController::create);
        app.delete("/api/books/{id}", bookController::delete);

        // Filter de Proteção de Rotas Administrativas (/api/users/*)
        app.before("/api/users*", ctx -> {
            // Permitir requisições pré-flight do CORS
            if ("OPTIONS".equalsIgnoreCase(ctx.method().name())) {
                return;
            }

            String authHeader = ctx.header("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new UnauthorizedResponse("Acesso negado. Token de autenticação não informado.");
            }

            String token = authHeader.substring(7);
            Optional<DecodedJWT> jwtOpt = JwtUtil.verifyToken(token);
            if (jwtOpt.isEmpty()) {
                throw new UnauthorizedResponse("Token inválido ou expirado.");
            }

            DecodedJWT jwt = jwtOpt.get();
            String role = jwt.getClaim("role").asString();
            if (!"ADMIN".equalsIgnoreCase(role)) {
                throw new ForbiddenResponse("Acesso negado. Apenas administradores podem gerenciar usuários.");
            }
        });

        // Rotas Protegidas de Usuários
        app.get("/api/users", userController::getAll);
        app.get("/api/users/{id}", userController::getById);
        app.post("/api/users", userController::create);
        app.put("/api/users/{id}", userController::update);
        app.delete("/api/users/{id}", userController::delete);

        // Registrar desligamento gracioso
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("Encerrando servidor Javalin e pool de conexões...");
            app.stop();
            dbManager.close();
        }));

        app.start(PORT);
        logger.info("Servidor Javalin rodando com sucesso em http://localhost:{}", PORT);
    }
}
