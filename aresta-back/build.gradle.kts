plugins {
    id("java")
    id("application")
    id("checkstyle")
}

checkstyle {
    toolVersion = "10.15.0"
    configFile = file("${projectDir}/config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
}

application {
    mainClass.set("org.example.Main")
}

tasks.named<JavaExec>("run") {
    systemProperties(System.getProperties().mapKeys { it.key.toString() })
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.xerial:sqlite-jdbc:3.45.3.0")
    implementation("org.flywaydb:flyway-core:10.10.0")
    implementation("com.zaxxer:HikariCP:5.1.0")
    implementation("ch.qos.logback:logback-classic:1.5.6")
    implementation("org.slf4j:slf4j-api:2.0.13")
    implementation("io.javalin:javalin:6.1.3")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.17.0")
    implementation("org.mindrot:jbcrypt:0.4")
    implementation("com.auth0:java-jwt:4.4.0")

    testImplementation(platform("org.junit:junit-bom:6.0.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()
}
