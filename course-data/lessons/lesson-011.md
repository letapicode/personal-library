# Lesson 11 — Singleton Pattern

The **Singleton Pattern** is used when you want a class to have exactly one shared instance within a defined scope, and you want a global access point to that instance.

The simple idea is:

> Create the object once, then reuse the same object everywhere.

---

# 1. Basic motivation

Imagine an application-wide configuration object:

```java
class AppConfig {

    private String environment;
}
```

You probably don't want dozens of separate config objects with conflicting values.

You may want:

```text
one configuration instance
shared across the application
```

That sounds like a Singleton use case.

---

# 2. Basic Singleton implementation

A classic version looks like this:

```java
class AppConfig {

    private static AppConfig instance;

    private AppConfig() {
    }

    public static AppConfig getInstance() {

        if (instance == null) {
            instance = new AppConfig();
        }

        return instance;
    }
}
```

Usage:

```java
AppConfig config1 =
        AppConfig.getInstance();

AppConfig config2 =
        AppConfig.getInstance();
```

Now:

```java
config1 == config2
```

should be:

```text
true
```

because both variables point to the same object.

---

# 3. Why is the constructor private?

This is essential:

```java
private AppConfig() {
}
```

If the constructor were public:

```java
new AppConfig();
```

could be called anywhere.

Then we could create unlimited instances.

So Singleton usually combines:

```text
private constructor
static instance
static access method
```

---

# 4. Visual model

Think:

```text
AppConfig class

       |
       | owns
       v

   one instance
       ^
       |
       |
getInstance()
```

Every caller gets that same object.

---

# 5. Lazy initialization

Our first version uses lazy initialization:

```java
if (instance == null) {
    instance = new AppConfig();
}
```

The object is not created until:

```java
AppConfig.getInstance();
```

is called for the first time.

So:

```text
application starts
    ↓
no AppConfig yet

getInstance()
    ↓
create AppConfig

future getInstance()
    ↓
return same instance
```

That's lazy initialization.

---

# 6. The thread-safety problem

Now we hit the first serious issue.

Suppose two threads call this at the same time:

```java
if (instance == null) {
    instance = new AppConfig();
}
```

Imagine:

```text
Thread A checks instance == null
→ true

Thread B checks instance == null
→ true
```

Then:

```text
Thread A creates AppConfig

Thread B creates AppConfig
```

Now we may have two instances.

That defeats the whole point.

---

# 7. Synchronized solution

One simple fix:

```java
class AppConfig {

    private static AppConfig instance;

    private AppConfig() {
    }

    public static synchronized
        AppConfig getInstance() {

        if (instance == null) {
            instance = new AppConfig();
        }

        return instance;
    }
}
```

Because the method is synchronized, only one thread can execute it at a time.

That makes initialization safe.

---

# 8. The downside of synchronized access

The problem is that every call to:

```java
getInstance()
```

now enters synchronization.

After initialization, we don't really need that overhead anymore.

So developers often use another technique.

---

# 9. Eager initialization

Instead of lazy initialization:

```java
class AppConfig {

    private static final AppConfig INSTANCE =
            new AppConfig();

    private AppConfig() {
    }

    public static AppConfig getInstance() {
        return INSTANCE;
    }
}
```

The object is created when the class is initialized.

This is simple and thread-safe due to Java class initialization guarantees.

Usage:

```java
AppConfig config =
        AppConfig.getInstance();
```

This is often a very good solution when creating the object is cheap.

---

# 10. Lazy vs eager

Eager:

```java
private static final AppConfig INSTANCE =
        new AppConfig();
```

Pros:

```text
simple
thread-safe
easy to reason about
```

Cons:

```text
object created even if never used
```

Lazy:

```java
if (instance == null) {
    instance = new AppConfig();
}
```

Pros:

```text
created only when needed
```

Cons:

```text
thread safety becomes more complicated
```

---

# 11. Double-checked locking

A common lazy thread-safe version is:

```java
class AppConfig {

    private static volatile AppConfig instance;

    private AppConfig() {
    }

    public static AppConfig getInstance() {

        if (instance == null) {

            synchronized (AppConfig.class) {

                if (instance == null) {
                    instance =
                            new AppConfig();
                }
            }
        }

        return instance;
    }
}
```

Notice two checks:

```java
if (instance == null)
```

outside the synchronized block,

and:

```java
if (instance == null)
```

inside it.

That's why it's called:

> Double-checked locking.

---

# 12. Why check twice?

First check:

```java
if (instance == null)
```

avoids synchronization after initialization.

Only if it might be null do we synchronize.

Then inside:

```java
if (instance == null)
```

we check again because another thread may have created it while we were waiting for the lock.

---

# 13. Why `volatile` matters

This is subtle.

We write:

```java
private static volatile AppConfig instance;
```

Without `volatile`, JVM/compiler optimizations and memory visibility rules can make double-checked locking unsafe.

Conceptually, object creation is not just one magical step.

It involves something like:

```text
allocate memory
initialize object
assign reference
```

Without proper memory guarantees, another thread could theoretically observe the reference before construction is fully visible.

`volatile` helps ensure safe publication and visibility.

For interview purposes, remember:

> Double-checked locking in Java should use `volatile`.

---

# 14. Initialization-on-demand holder idiom

A cleaner lazy approach in Java is:

```java
class AppConfig {

    private AppConfig() {
    }

    private static class Holder {

        private static final AppConfig INSTANCE =
                new AppConfig();
    }

    public static AppConfig getInstance() {

        return Holder.INSTANCE;
    }
}
```

Why is this useful?

The nested `Holder` class is only initialized when:

```java
Holder.INSTANCE
```

is first accessed.

So we get:

```text
lazy initialization
thread safety
no explicit synchronization
```

This is a strong Java Singleton implementation.

---

# 15. Enum Singleton

Another famous Java approach:

```java
enum AppConfig {

    INSTANCE;

    public void load() {
        System.out.println(
            "Loading configuration"
        );
    }
}
```

Usage:

```java
AppConfig.INSTANCE.load();
```

This is concise and gets strong guarantees from Java around:

```text
serialization
instance uniqueness
class initialization
```

For many simple Java Singleton cases, `enum` is considered robust.

---

# 16. Why enum Singleton is special

Traditional Singletons can have edge cases involving:

```text
serialization
reflection
custom class loading
```

An enum handles some of these concerns more safely.

Example:

```java
enum DatabaseRegistry {

    INSTANCE;
}
```

There is only one enum constant named:

```text
INSTANCE
```

per relevant class-loader context.

---

# 17. Singleton scope is not literally universal

This nuance matters.

When we say:

> One instance

we usually mean:

> One instance per class-loading context or container scope.

For example, separate JVMs can each have their own Singleton.

So in distributed systems:

```text
Service instance A
→ Singleton X

Service instance B
→ Singleton X
```

These are not the same physical object.

Singleton does not magically create one global object across a cluster.

---

# 18. Singleton vs global variable

Singleton can behave like controlled global state.

For example:

```java
AppConfig.getInstance()
```

can be called from anywhere.

That's convenient.

But convenience is exactly where problems can begin.

Suppose:

```java
class OrderService {

    public void checkout() {

        Logger logger =
                Logger.getInstance();

        logger.log("Checkout");
    }
}
```

The dependency on `Logger` is hidden inside the method.

The constructor doesn't show it.

---

# 19. Hidden dependencies

Compare:

```java
class OrderService {

    public void checkout() {

        AuditLogger.getInstance()
                .log("checkout");
    }
}
```

with:

```java
class OrderService {

    private final AuditLogger logger;

    public OrderService(
            AuditLogger logger) {

        this.logger = logger;
    }
}
```

The second version clearly says:

> `OrderService` depends on `AuditLogger`.

The Singleton version hides that dependency.

That can hurt readability and testing.

---

# 20. Singleton and DIP tension

Remember DIP:

> Depend on abstractions rather than concrete details.

Suppose:

```java
PaymentLogger.getInstance()
```

is called directly everywhere.

Now business code depends on:

```text
specific concrete singleton
static global access
```

That's often less flexible than:

```java
interface Logger {

    void log(String message);
}
```

and injection:

```java
class CheckoutService {

    private final Logger logger;

    CheckoutService(Logger logger) {
        this.logger = logger;
    }
}
```

So Singleton can work against DIP if used carelessly.

---

# 21. Testing problem

Suppose:

```java
class UserService {

    public void register(User user) {

        DatabaseConnection
            .getInstance()
            .save(user);
    }
}
```

How do we unit-test `UserService`?

It directly reaches into the Singleton.

Replacing that database with:

```text
FakeDatabase
MockDatabase
InMemoryDatabase
```

is difficult.

Compare:

```java
class UserService {

    private final UserRepository repository;

    public UserService(
            UserRepository repository) {

        this.repository = repository;
    }
}
```

Now tests can inject:

```java
new FakeUserRepository();
```

Much easier.

---

# 22. This is why Singleton is controversial

Singleton itself is not automatically bad.

But it is often abused as:

> Easy global access to anything.

For example:

```text
DatabaseManager.getInstance()
Logger.getInstance()
EmailManager.getInstance()
CacheManager.getInstance()
UserManager.getInstance()
PaymentManager.getInstance()
```

Now every class can silently depend on everything.

You get hidden global coupling.

That's why people sometimes call Singleton an anti-pattern.

The better statement is:

> Singleton becomes problematic when used as uncontrolled global mutable state or as a substitute for proper dependency management.

---

# 23. Good candidates

Singleton may be reasonable when there truly should be one process-level coordinator or registry.

Examples can include:

```text
application configuration snapshot
shared registry
metrics registry
process-wide coordinator
certain caches
certain resource managers
```

But always ask:

> Do I actually require one instance, or do I merely want convenient access?

Those are different requirements.

---

# 24. Bad candidate: business state

Imagine:

```java
class ShoppingCart {

    private static final ShoppingCart INSTANCE =
            new ShoppingCart();
}
```

That would be disastrous in a multi-user application.

Every user could potentially share the same cart.

A shopping cart belongs to:

```text
a user/session
```

not:

```text
the whole application
```

So Singleton would be the wrong scope.

---

# 25. Scope matters

Think in scopes:

```text
application-wide
request
session
user
thread
transaction
```

Before using Singleton, ask:

> At what scope should this object be unique?

A request-specific object should not become application-wide just because Singleton is easy.

---

# 26. Example: configuration

A better Singleton candidate:

```java
final class ApplicationConfig {

    private static final ApplicationConfig INSTANCE =
            new ApplicationConfig();

    private final String environment =
            "production";

    private ApplicationConfig() {
    }

    public static ApplicationConfig getInstance() {
        return INSTANCE;
    }

    public String getEnvironment() {
        return environment;
    }
}
```

The important thing here is that the object is mostly read-only.

Immutable or effectively immutable Singletons are usually easier to reason about than mutable ones.

---

# 27. Mutable Singleton danger

Suppose:

```java
class GlobalCounter {

    private static final GlobalCounter INSTANCE =
            new GlobalCounter();

    private int value;

    public void increment() {
        value++;
    }
}
```

Now many unrelated parts of the application mutate:

```java
GlobalCounter.getInstance()
```

You can get:

```text
race conditions
test interference
hard-to-track state changes
ordering bugs
```

Global mutable state is one of the biggest Singleton dangers.

---

# 28. Singleton and thread safety are separate concerns

Even if instance creation is thread-safe:

```java
private static final Singleton INSTANCE =
        new Singleton();
```

the object's methods may not be.

Example:

```java
class CounterSingleton {

    private int count;

    public void increment() {
        count++;
    }
}
```

Multiple threads can still race on `count`.

So:

> Thread-safe Singleton creation does not imply thread-safe Singleton behavior.

Very important.

---

# 29. Singleton and serialization

Suppose you serialize and deserialize a traditional Singleton.

Depending on implementation, deserialization could produce another object.

One classic safeguard is:

```java
private Object readResolve() {
    return INSTANCE;
}
```

But this adds complexity.

This is another reason enum Singleton can be attractive in Java.

---

# 30. Singleton and reflection

A private constructor is not always absolutely impossible to invoke through reflection in ordinary unrestricted environments.

That means a naive Singleton can potentially be broken by reflective construction.

Again, enum-based Singletons are more resistant to this kind of issue.

For normal application code, you usually shouldn't obsess over hostile reflection unless your environment requires it, but it's a useful interview point.

---

# 31. Singleton and cloning

Suppose your Singleton implements `Cloneable`.

Then:

```java
singleton.clone();
```

could potentially produce another instance.

That violates the intent.

So Singletons should generally avoid cloneability, or explicitly prevent duplication.

---

# 32. Singleton and subclassing

A typical Singleton uses:

```java
private Singleton() {
}
```

That prevents subclasses from invoking the constructor.

This is usually intentional.

Singleton plus inheritance tends to complicate lifecycle and identity semantics.

---

# 33. Spring singleton beans

Now a very important distinction.

In Spring:

```java
@Service
class OrderService {
}
```

is singleton-scoped by default.

But that does **not** usually mean the class itself implements the Singleton pattern.

You don't write:

```java
OrderService.getInstance()
```

Instead, the Spring container creates and manages one bean instance:

```text
Spring Container
       |
       v
one OrderService bean
```

and injects it where needed.

---

# 34. Classic Singleton vs Spring singleton

Classic Singleton:

```java
OrderService.getInstance()
```

The class itself controls:

```text
construction
storage of the instance
access
```

Spring singleton:

```java
@Service
class OrderService {
}
```

The container controls the instance lifecycle.

Your code just asks for the dependency through injection.

This is generally much friendlier to testing and dependency management.

---

# 35. Why DI containers reduce the need for Singleton

Without a framework, you might think:

```text
"I need one Logger everywhere,
so I'll make Logger a Singleton."
```

With dependency injection, you can configure one logger instance at the composition root:

```java
Logger logger =
        new ConsoleLogger();

OrderService orders =
        new OrderService(logger);

PaymentService payments =
        new PaymentService(logger);
```

Both receive the same instance.

You achieve:

```text
one shared object
```

without:

```text
global static access
```

That's often a cleaner design.

---

# 36. Singleton vs shared instance

This distinction is crucial.

Suppose:

```java
Logger logger =
        new ConsoleLogger();

ServiceA a =
        new ServiceA(logger);

ServiceB b =
        new ServiceB(logger);
```

There is one shared `Logger`.

But `Logger` itself is not necessarily a Singleton.

Nothing prevents us from creating another:

```java
Logger anotherLogger =
        new ConsoleLogger();
```

So:

> "One instance currently used by the application" is not the same as "class enforces one instance."

Often the former is sufficient.

---

# 37. Composition root example

We learned the composition root in Lesson 6.

You can write:

```java
public class Main {

    public static void main(String[] args) {

        Logger logger =
                new ConsoleLogger();

        Database database =
                new PostgreSQLDatabase();

        OrderService orders =
                new OrderService(
                    logger,
                    database
                );

        PaymentService payments =
                new PaymentService(
                    logger
                );
    }
}
```

Here both services share `logger`.

No Singleton pattern required.

This is often preferable.

---

# 38. Singleton vs static utility class

Another common comparison.

Static utility:

```java
class MathUtils {

    private MathUtils() {
    }

    public static int add(
            int a,
            int b) {

        return a + b;
    }
}
```

No object exists.

You call:

```java
MathUtils.add(2, 3);
```

Singleton:

```java
Config.getInstance()
```

returns a real object with:

```text
identity
state
instance methods
possible interfaces
```

So Singleton is not the same as a static utility class.

---

# 39. Singleton with interfaces

You can still hide a Singleton implementation behind an interface.

For example:

```java
interface Configuration {

    String getEnvironment();
}
```

Implementation:

```java
class DefaultConfiguration
        implements Configuration {

    private static final
        DefaultConfiguration INSTANCE =
            new DefaultConfiguration();

    private DefaultConfiguration() {
    }

    public static DefaultConfiguration
        getInstance() {

        return INSTANCE;
    }

    @Override
    public String getEnvironment() {
        return "production";
    }
}
```

But client code is usually cleaner if the instance is injected as:

```java
Configuration config;
```

rather than clients calling:

```java
DefaultConfiguration.getInstance();
```

directly.

---

# 40. Singleton in low-level design interviews

Suppose an interviewer asks:

> Design a Logger.

Many candidates immediately say:

> Logger should be Singleton.

Be careful.

You should first ask:

```text
Why must there be exactly one logger?
Can we have multiple appenders?
Do tests need separate instances?
Does each application module need its own logger?
```

Modern logging frameworks commonly support many named logger objects while sharing lower-level configuration/resources.

So don't automatically use Singleton just because something is "shared."

---

# 41. Another classic interview trap: database connection

People sometimes say:

> DatabaseConnection should be Singleton.

Usually that's too simplistic.

Modern applications commonly use a:

```text
connection pool
```

containing multiple database connections.

So:

```text
one DatabaseConnection
```

may actually hurt concurrency.

What could be shared is:

```text
DataSource / connection pool manager
```

not necessarily an individual connection.

This shows why design patterns should follow requirements, not memorization.

---

# 42. Practical comparison of implementations

### Naive lazy Singleton

```java
if (instance == null) {
    instance = new Singleton();
}
```

Simple, but not safe for concurrent access.

### Synchronized lazy Singleton

```java
public static synchronized
Singleton getInstance()
```

Safe but introduces synchronization on every call.

### Eager Singleton

```java
private static final Singleton INSTANCE =
        new Singleton();
```

Simple and safe when eager construction is acceptable.

### Double-checked locking

```java
private static volatile Singleton instance;
```

plus synchronization.

Lazy and efficient after initialization, but more complicated.

### Holder idiom

```java
private static class Holder {
    static final Singleton INSTANCE =
            new Singleton();
}
```

Lazy, thread-safe, concise.

### Enum Singleton

```java
enum Singleton {
    INSTANCE
}
```

Very robust for many Java use cases.

---

# 43. Which implementation should you prefer?

For ordinary Java:

If eager creation is fine:

```java
private static final ...
```

is simple.

If lazy initialization matters:

```text
holder idiom
```

is elegant.

If the type naturally fits an enum singleton:

```java
enum Singleton {
    INSTANCE
}
```

is robust.

But before choosing an implementation, ask the more important question:

> Do I need Singleton at all?

---

# 44. Singleton interview answer

If asked:

> What is Singleton?

A strong answer:

> Singleton is a creational design pattern that ensures a class has a single shared instance within a given runtime scope and provides access to that instance. In Java, it can be implemented using eager initialization, synchronized lazy initialization, the holder idiom, or an enum.

Then add the important tradeoff:

> It should be used carefully because global access can create hidden dependencies and shared mutable state, making code harder to test and maintain. In DI-based applications, a container-managed singleton-scoped object is often preferable to a static Singleton.

That is much stronger than simply showing `getInstance()`.

---

# 45. Singleton and SOLID

Singleton can interact with SOLID in interesting ways.

With SRP, a Singleton shouldn't become:

```text
GlobalManager
```

responsible for everything.

With OCP, direct calls to a concrete Singleton can make substitution harder.

With LSP, if it implements an interface, it should honor that interface normally.

With ISP, don't expose a massive application-wide interface.

With DIP, avoid high-level modules directly calling concrete Singleton accessors if dependency injection can express the relationship more cleanly.

---

# 46. When Singleton is reasonable

Consider it when:

- uniqueness is a real domain or runtime requirement,
- sharing the same instance is important,
- the scope is well-defined,
- lifecycle should be centralized,
- global mutable state is limited or avoided.

Do not use it merely because:

> "I want to access this class from anywhere."

That's usually the dangerous motivation.

---

# 47. Mental model

Think:

```text
Singleton
   |
   +-- restrict construction
   |
   +-- own one instance
   |
   +-- provide shared access
```

But then ask:

```text
Do I require uniqueness?

or

Do I merely require sharing?
```

If you only require sharing, dependency injection may be enough.

---

# Creational patterns complete

You now know the five classic GoF creational patterns:

```text
Factory Method
→ Let subclasses decide which concrete product to create.

Abstract Factory
→ Create families of related products.

Builder
→ Construct complex objects step by step.

Prototype
→ Create objects by copying existing objects.

Singleton
→ Control access to one shared instance.
```

A useful recognition table is:

| Problem | Pattern |
|---|---|
| Which implementation should be instantiated? | Factory Method |
| Need a compatible family of products? | Abstract Factory |
| Too many construction parameters or steps? | Builder |
| Easier to copy a configured object? | Prototype |
| Truly require one shared instance? | Singleton |

The important part is not memorizing the names. It is identifying the **creation problem** first.

# Next: Lesson 12 — Adapter Pattern

We've completed the **Creational Patterns**.

Now we move into **Structural Patterns**, which answer:

> How should objects and classes fit together?

We'll start with one of the most practical patterns: **Adapter**.

Imagine your application expects:

```java
interface PaymentProcessor {
    void pay(double amount);
}
```

but a third-party library gives you:

```java
class LegacyPaymentGateway {
    void makePaymentInCents(int cents);
}
```

You can't conveniently change either side.

An **Adapter** sits between them:

```text
Your Application
      |
      v
PaymentProcessor
      |
      v
Adapter
      |
      v
LegacyPaymentGateway
```

Lesson 12 will cover object adapters, class adapters, third-party APIs, legacy systems, DTO conversion, Adapter vs Facade vs Decorator, and how adapters are used constantly in real-world integrations.
