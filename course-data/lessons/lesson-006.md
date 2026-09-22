# Lesson 6 — Dependency Inversion Principle

The **Dependency Inversion Principle**, or **DIP**, says:

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

And:

> Abstractions should not depend on details. Details should depend on abstractions.

That wording sounds complicated, so let's make it practical.

The core idea is:

> Your important business logic should not be tightly coupled to concrete technical details.

For example, your order system should not care whether data is stored in:

```text
MySQL
PostgreSQL
MongoDB
an in-memory database
a remote API
```

It should depend on a stable abstraction.

---

# Start with the bad design

Imagine:

```java
class OrderService {

    private MySQLDatabase database =
            new MySQLDatabase();

    public void createOrder(Order order) {

        // business logic

        database.save(order);
    }
}
```

This works.

But `OrderService` directly depends on:

```java
MySQLDatabase
```

The dependency looks like:

```text
OrderService
     |
     v
MySQLDatabase
```

Now the company says:

> Move from MySQL to PostgreSQL.

You must modify `OrderService`.

Maybe:

```java
class OrderService {

    private PostgreSQLDatabase database =
            new PostgreSQLDatabase();
}
```

The business logic had to change because of a database decision.

That's tight coupling.

---

# What is the high-level module?

In this example:

```text
OrderService
```

is a **high-level module**.

Why?

Because it expresses business behavior:

> Create an order.

The database implementation:

```text
MySQLDatabase
```

is a **low-level module**.

It handles technical detail:

> How exactly is data persisted?

We generally don't want our business logic tightly bound to infrastructure details.

---

# The problem visually

Current design:

```text
Business Logic
    |
    v
Technical Detail
```

Specifically:

```text
OrderService
    |
    v
MySQLDatabase
```

So the higher-level code depends directly on the lower-level implementation.

DIP tells us to introduce an abstraction.

---

# Step 1 — Define an abstraction

```java
interface OrderRepository {

    void save(Order order);
}
```

This describes what the business layer needs:

> Save an order.

It does not say how.

That's important.

---

# Step 2 — Make the low-level detail implement it

```java
class MySQLOrderRepository
        implements OrderRepository {

    @Override
    public void save(Order order) {
        System.out.println(
            "Saving order to MySQL"
        );
    }
}
```

Or:

```java
class PostgreSQLOrderRepository
        implements OrderRepository {

    @Override
    public void save(Order order) {
        System.out.println(
            "Saving order to PostgreSQL"
        );
    }
}
```

---

# Step 3 — Make high-level code depend on the abstraction

```java
class OrderService {

    private final OrderRepository repository;

    public OrderService(
            OrderRepository repository) {

        this.repository = repository;
    }

    public void createOrder(Order order) {

        // business logic

        repository.save(order);
    }
}
```

Now:

```text
OrderService
     |
     v
OrderRepository
     ^
     |
 ------------------------
 |                      |
MySQLRepository   PostgreSQLRepository
```

This is much better.

---

# Why is it called Dependency Inversion?

Originally:

```text
High-level code
      |
      v
Low-level detail
```

Example:

```text
OrderService
      |
      v
MySQLDatabase
```

After applying DIP:

```text
        OrderRepository
           ^       ^
           |       |
OrderService     MySQLRepository
```

Both depend around the abstraction.

The dependency relationship has been reorganized so that the important business layer does not directly depend on the implementation detail.

That's the "inversion."

---

# Important point

Many developers misunderstand DIP as:

> Always create an interface for every class.

No.

This:

```java
interface Calculator {
    int add(int a, int b);
}
```

with only one implementation:

```java
class CalculatorImpl
```

may add no real value if no abstraction boundary is needed.

The useful question is:

> Is this dependency a detail that I may reasonably want to replace, isolate, mock, or vary?

Examples often include:

```text
databases
payment gateways
email providers
external APIs
file systems
message queues
clock/time sources
storage systems
notification providers
```

These are good candidates for abstraction boundaries.

---

# Payment example

Bad:

```java
class CheckoutService {

    private StripePaymentGateway gateway =
            new StripePaymentGateway();

    public void checkout(double amount) {
        gateway.charge(amount);
    }
}
```

Now `CheckoutService` depends directly on Stripe.

Suppose tomorrow you want:

```text
PayPal
Adyen
Braintree
Square
```

You must modify the class.

Better:

```java
interface PaymentGateway {

    void charge(double amount);
}
```

Stripe:

```java
class StripePaymentGateway
        implements PaymentGateway {

    @Override
    public void charge(double amount) {
        System.out.println(
            "Charging $" + amount
            + " through Stripe"
        );
    }
}
```

PayPal:

```java
class PayPalPaymentGateway
        implements PaymentGateway {

    @Override
    public void charge(double amount) {
        System.out.println(
            "Charging $" + amount
            + " through PayPal"
        );
    }
}
```

Service:

```java
class CheckoutService {

    private final PaymentGateway gateway;

    public CheckoutService(
            PaymentGateway gateway) {

        this.gateway = gateway;
    }

    public void checkout(double amount) {
        gateway.charge(amount);
    }
}
```

Usage:

```java
PaymentGateway gateway =
        new StripePaymentGateway();

CheckoutService service =
        new CheckoutService(gateway);

service.checkout(100);
```

The business service no longer knows about Stripe specifically.

---

# This also supports OCP

Remember Open/Closed Principle?

We can now add:

```java
class AdyenPaymentGateway
        implements PaymentGateway {
}
```

without changing:

```java
CheckoutService
```

So DIP and OCP often work together.

DIP creates the abstraction boundary.

OCP benefits because new implementations can be added behind that abstraction.

---

# Dependency Injection

Now we need to separate two concepts:

```text
Dependency Inversion Principle
```

and:

```text
Dependency Injection
```

They are related, but they are not the same thing.

DIP is a **design principle**.

Dependency Injection is a **technique**.

---

# What is a dependency?

Suppose:

```java
class OrderService {

    private PaymentGateway gateway;
}
```

`PaymentGateway` is a dependency of `OrderService`.

`OrderService` needs it to perform its job.

Without dependency injection, the class may create it itself:

```java
class OrderService {

    private PaymentGateway gateway =
            new StripePaymentGateway();
}
```

That creates tight coupling.

With dependency injection:

```java
class OrderService {

    private final PaymentGateway gateway;

    public OrderService(
            PaymentGateway gateway) {

        this.gateway = gateway;
    }
}
```

Now the dependency is supplied from outside.

That's dependency injection.

---

# Constructor Injection

The most common form is constructor injection.

```java
class NotificationService {

    private final EmailSender emailSender;

    public NotificationService(
            EmailSender emailSender) {

        this.emailSender = emailSender;
    }
}
```

Then:

```java
EmailSender sender =
        new GmailSender();

NotificationService service =
        new NotificationService(sender);
```

The service does not create its own dependency.

It receives it.

---

# Why constructor injection is good

It has several advantages.

First, the dependency is explicit.

You can immediately see:

```java
public NotificationService(
        EmailSender emailSender)
```

that this class cannot work without an `EmailSender`.

Second, dependencies can be immutable:

```java
private final EmailSender emailSender;
```

Third, the object cannot easily exist in a half-configured state.

Fourth, testing becomes much easier.

---

# Testing without DIP

Suppose:

```java
class UserService {

    private GmailEmailSender sender =
            new GmailEmailSender();

    public void register(User user) {
        sender.sendWelcomeEmail(user);
    }
}
```

When you test `UserService`, it may try to:

```text
connect to Gmail
authenticate
send an actual email
use the network
```

That's terrible for a unit test.

---

# Testing with DIP

Create:

```java
interface EmailSender {

    void sendWelcomeEmail(User user);
}
```

Production implementation:

```java
class GmailEmailSender
        implements EmailSender {

    @Override
    public void sendWelcomeEmail(User user) {
        System.out.println(
            "Sending Gmail email"
        );
    }
}
```

Fake implementation:

```java
class FakeEmailSender
        implements EmailSender {

    private boolean emailSent = false;

    @Override
    public void sendWelcomeEmail(User user) {
        emailSent = true;
    }

    public boolean wasEmailSent() {
        return emailSent;
    }
}
```

Service:

```java
class UserService {

    private final EmailSender sender;

    public UserService(EmailSender sender) {
        this.sender = sender;
    }

    public void register(User user) {
        sender.sendWelcomeEmail(user);
    }
}
```

Test:

```java
FakeEmailSender sender =
        new FakeEmailSender();

UserService service =
        new UserService(sender);

service.register(new User());

assert sender.wasEmailSent();
```

No network.

No Gmail.

No credentials.

No real email.

This is a huge benefit of DIP.

---

# Business logic becomes easier to test

Suppose:

```java
class CheckoutService {

    private final PaymentGateway gateway;

    public CheckoutService(
            PaymentGateway gateway) {

        this.gateway = gateway;
    }

    public boolean checkout(double amount) {

        if (amount <= 0) {
            return false;
        }

        gateway.charge(amount);

        return true;
    }
}
```

A fake:

```java
class FakePaymentGateway
        implements PaymentGateway {

    public double chargedAmount;

    @Override
    public void charge(double amount) {
        chargedAmount = amount;
    }
}
```

Now we can test:

```java
FakePaymentGateway gateway =
        new FakePaymentGateway();

CheckoutService service =
        new CheckoutService(gateway);

boolean result =
        service.checkout(500);

assert result;
assert gateway.chargedAmount == 500;
```

Very clean.

---

# Dependency Injection types

There are three common styles.

## 1. Constructor injection

```java
class Service {

    private final Repository repository;

    public Service(Repository repository) {
        this.repository = repository;
    }
}
```

Usually the preferred default.

---

## 2. Setter injection

```java
class Service {

    private Repository repository;

    public void setRepository(
            Repository repository) {

        this.repository = repository;
    }
}
```

Useful when the dependency is optional or needs to change later.

But it also allows:

```java
Service service = new Service();
```

where the dependency may not yet exist.

That can make object validity harder to guarantee.

---

## 3. Field injection

In Spring, you may see:

```java
class Service {

    @Autowired
    private Repository repository;
}
```

It works, but constructor injection is generally easier to test and makes dependencies explicit.

Modern Spring code commonly prefers:

```java
@Service
class OrderService {

    private final OrderRepository repository;

    public OrderService(
            OrderRepository repository) {

        this.repository = repository;
    }
}
```

Spring provides the dependency automatically.

---

# Spring and Dependency Injection

Suppose:

```java
public interface PaymentGateway {

    void charge(double amount);
}
```

Implementation:

```java
@Component
public class StripePaymentGateway
        implements PaymentGateway {

    @Override
    public void charge(double amount) {
        System.out.println(
            "Stripe charge: " + amount
        );
    }
}
```

Service:

```java
@Service
public class CheckoutService {

    private final PaymentGateway gateway;

    public CheckoutService(
            PaymentGateway gateway) {

        this.gateway = gateway;
    }
}
```

Spring sees:

```java
PaymentGateway
```

and finds an implementation:

```java
StripePaymentGateway
```

Then Spring creates the objects and wires them together.

Conceptually:

```text
Spring Container

creates:
StripePaymentGateway

then creates:
CheckoutService(StripePaymentGateway)
```

Your service doesn't call:

```java
new StripePaymentGateway()
```

The framework manages object creation and dependency wiring.

---

# Inversion of Control

Now we reach another term:

> IoC — Inversion of Control

Imagine ordinary Java code:

```java
public static void main(String[] args) {

    StripePaymentGateway gateway =
            new StripePaymentGateway();

    CheckoutService service =
            new CheckoutService(gateway);

    service.checkout(100);
}
```

You create and control all objects yourself.

With Spring:

```text
Spring creates objects.
Spring stores them.
Spring connects dependencies.
Spring controls lifecycle.
Spring invokes framework hooks.
```

So control over object construction and management is inverted from your application code to the framework/container.

That's **Inversion of Control**.

---

# DIP vs DI vs IoC

This distinction is extremely important.

Think of it like this:

```text
DIP
= principle

DI
= technique

IoC
= broader architectural idea
```

More precisely:

```text
Dependency Inversion Principle
    ↓
"Depend on abstractions"

Dependency Injection
    ↓
"Give dependencies from outside"

Inversion of Control
    ↓
"Framework/container controls creation,
 wiring, lifecycle, and execution flow"
```

Spring uses dependency injection as one mechanism to implement inversion of control.

---

# Very common interview question

> What is the difference between Dependency Inversion and Dependency Injection?

Good answer:

> Dependency Inversion is a SOLID design principle that says high-level and low-level modules should depend on abstractions rather than concrete implementations. Dependency Injection is a technique for providing those dependencies from outside the object rather than having the object create them itself.

Excellent.

---

# Another example — Notification system

Bad:

```java
class AlertService {

    private GmailSender sender =
            new GmailSender();

    public void sendAlert(String message) {
        sender.send(message);
    }
}
```

Problems:

```text
AlertService knows Gmail
hard to replace Gmail
hard to test
hard to add other channels
```

Better:

```java
interface MessageSender {

    void send(String message);
}
```

Gmail:

```java
class GmailSender
        implements MessageSender {

    public void send(String message) {
        System.out.println(
            "Gmail: " + message
        );
    }
}
```

SMS:

```java
class SmsSender
        implements MessageSender {

    public void send(String message) {
        System.out.println(
            "SMS: " + message
        );
    }
}
```

Service:

```java
class AlertService {

    private final MessageSender sender;

    public AlertService(
            MessageSender sender) {

        this.sender = sender;
    }

    public void sendAlert(String message) {
        sender.send(message);
    }
}
```

Now:

```text
AlertService
    |
    v
MessageSender
   ^     ^
   |     |
Gmail   SMS
```

Clean.

---

# Who should define the abstraction?

This is a deeper design idea.

Suppose `OrderService` needs:

```java
save(Order order)
```

A useful principle is:

> The abstraction should reflect what the high-level module needs.

So:

```java
interface OrderRepository {

    void save(Order order);
}
```

is better than exposing raw infrastructure details like:

```java
interface Database {

    void executeSql(String sql);

    Connection getConnection();

    ResultSet query(String sql);
}
```

Why?

Because now `OrderService` would still know database concepts.

The abstraction should describe the business-facing need, not leak low-level implementation details.

---

# Bad abstraction

```java
interface Database {

    void executeQuery(String sql);
}
```

Then:

```java
class OrderService {

    private Database database;

    public void createOrder(Order order) {

        database.executeQuery(
            "INSERT INTO orders ..."
        );
    }
}
```

We technically used an interface.

But `OrderService` still knows SQL.

So we're not properly separating business logic from persistence detail.

Better:

```java
interface OrderRepository {

    void save(Order order);
}
```

Then:

```java
class OrderService {

    private final OrderRepository repository;

    public void createOrder(Order order) {
        repository.save(order);
    }
}
```

Much stronger abstraction.

---

# DIP is not just about interfaces

You may hear:

> DIP means use interfaces.

Interfaces are a common tool, but DIP is about the dependency structure.

You could also depend on:

```text
abstract classes
function abstractions
callbacks
ports
contracts
```

The key is:

> High-level policy should not be tied to low-level implementation details.

---

# Hexagonal architecture connection

This idea grows into larger architectural styles.

You may later encounter:

```text
Hexagonal Architecture
Clean Architecture
Ports and Adapters
Onion Architecture
```

They heavily use the same principle.

For example:

```text
Business Logic
      |
      v
PaymentGateway interface
      ^
      |
Stripe Adapter
```

The business layer owns the abstraction.

The infrastructure layer implements it.

This is DIP at architectural scale.

---

# Another example — Clock dependency

Here's a more subtle example.

Bad:

```java
class DiscountService {

    public boolean isWeekend() {

        LocalDate today =
                LocalDate.now();

        return today.getDayOfWeek()
                == DayOfWeek.SATURDAY;
    }
}
```

Testing this behavior depends on the real current date.

Instead, we can inject time:

```java
interface Clock {

    LocalDate today();
}
```

Production:

```java
class SystemClock implements Clock {

    public LocalDate today() {
        return LocalDate.now();
    }
}
```

Fake:

```java
class FakeClock implements Clock {

    private final LocalDate date;

    public FakeClock(LocalDate date) {
        this.date = date;
    }

    public LocalDate today() {
        return date;
    }
}
```

Now tests can control time.

This shows that DIP is useful beyond databases and payment gateways.

Any nondeterministic or external dependency can be abstracted.

---

# File system example

Bad:

```java
class ReportService {

    public void saveReport(String report) {

        Files.writeString(
            Path.of("report.txt"),
            report
        );
    }
}
```

The service directly depends on the file system.

Better:

```java
interface ReportStorage {

    void save(String report);
}
```

File implementation:

```java
class FileReportStorage
        implements ReportStorage {

    public void save(String report) {
        System.out.println(
            "Saving report to file"
        );
    }
}
```

Database implementation:

```java
class DatabaseReportStorage
        implements ReportStorage {

    public void save(String report) {
        System.out.println(
            "Saving report to database"
        );
    }
}
```

Service:

```java
class ReportService {

    private final ReportStorage storage;

    public ReportService(
            ReportStorage storage) {

        this.storage = storage;
    }

    public void generate() {

        String report = "Report Data";

        storage.save(report);
    }
}
```

Again, business behavior is isolated from technical detail.

---

# What should be injected?

Good candidates include things like:

```text
repositories
payment gateways
email senders
HTTP clients
file storage
message queues
time/clock
random number generators
external API clients
notification systems
cache providers
```

You usually don't need to inject trivial pure value objects.

For example:

```java
User user = new User("Alice");
```

doesn't need some elaborate `UserFactoryProviderManager` unless creation is genuinely complex.

Avoid abstraction for abstraction's sake.

---

# Constructor injection and required dependencies

Suppose:

```java
class CheckoutService {

    private final PaymentGateway gateway;
    private final OrderRepository repository;
    private final EmailSender emailSender;

    public CheckoutService(
            PaymentGateway gateway,
            OrderRepository repository,
            EmailSender emailSender) {

        this.gateway = gateway;
        this.repository = repository;
        this.emailSender = emailSender;
    }
}
```

This tells us exactly what the class requires.

That's useful.

But notice something else.

If the constructor becomes:

```java
CheckoutService(
    PaymentGateway gateway,
    OrderRepository repository,
    EmailSender emailSender,
    Logger logger,
    TaxCalculator taxCalculator,
    InventoryService inventoryService,
    FraudDetector fraudDetector,
    AnalyticsService analyticsService,
    CouponService couponService,
    ...
)
```

that may indicate another problem.

Possibly:

> `CheckoutService` has too many responsibilities.

So dependency injection can sometimes expose SRP violations.

Interesting connection.

---

# DIP and all SOLID principles

Now we can connect all five.

## S — Single Responsibility

```text
Separate unrelated responsibilities.
```

Example:

```text
OrderService
OrderRepository
EmailService
PaymentService
```

---

## O — Open/Closed

```text
Allow expected extension without repeatedly
modifying stable code.
```

Example:

```text
PaymentGateway
 ├── StripeGateway
 ├── PayPalGateway
 └── AdyenGateway
```

---

## L — Liskov Substitution

```text
Every implementation must honor
the abstraction's contract.
```

A `PaymentGateway` implementation should genuinely support the promised operation.

---

## I — Interface Segregation

```text
Keep interfaces focused.
```

Instead of:

```java
PaymentEverything
```

with:

```text
pay
refund
invoice
report
email
```

create focused abstractions.

---

## D — Dependency Inversion

```text
High-level business logic depends on
those abstractions rather than details.
```

Example:

```text
CheckoutService
       |
       v
PaymentGateway
       ^
       |
StripeGateway
```

Now SOLID starts feeling like one system rather than five disconnected definitions.

---

# Full example combining SOLID

Let's imagine an order checkout system.

Interfaces:

```java
interface PaymentGateway {

    void charge(double amount);
}
```

```java
interface OrderRepository {

    void save(Order order);
}
```

```java
interface NotificationSender {

    void send(String message);
}
```

Implementations:

```java
class StripeGateway
        implements PaymentGateway {

    public void charge(double amount) {
        System.out.println(
            "Stripe charged " + amount
        );
    }
}
```

```java
class MySQLOrderRepository
        implements OrderRepository {

    public void save(Order order) {
        System.out.println(
            "Order saved to MySQL"
        );
    }
}
```

```java
class EmailNotificationSender
        implements NotificationSender {

    public void send(String message) {
        System.out.println(
            "Email sent: " + message
        );
    }
}
```

Business service:

```java
class CheckoutService {

    private final PaymentGateway gateway;
    private final OrderRepository repository;
    private final NotificationSender notifier;

    public CheckoutService(
            PaymentGateway gateway,
            OrderRepository repository,
            NotificationSender notifier) {

        this.gateway = gateway;
        this.repository = repository;
        this.notifier = notifier;
    }

    public void checkout(Order order) {

        gateway.charge(order.getTotal());

        repository.save(order);

        notifier.send(
            "Order completed"
        );
    }
}
```

Composition root:

```java
public class Main {

    public static void main(String[] args) {

        PaymentGateway gateway =
                new StripeGateway();

        OrderRepository repository =
                new MySQLOrderRepository();

        NotificationSender notifier =
                new EmailNotificationSender();

        CheckoutService checkoutService =
                new CheckoutService(
                    gateway,
                    repository,
                    notifier
                );

        checkoutService.checkout(
            new Order(100)
        );
    }
}
```

Notice where concrete classes are created:

```java
Main
```

This is often called the **composition root**.

It's the place where we assemble the application.

Business classes don't create their infrastructure dependencies themselves.

---

# Interview answer

If asked:

> What is the Dependency Inversion Principle?

A strong answer:

> DIP states that high-level business modules should not depend directly on low-level implementation details. Both should depend on abstractions, and the concrete details should implement those abstractions. For example, an `OrderService` should depend on an `OrderRepository` interface rather than directly on `MySQLOrderRepository`.

If asked:

> Why is DIP useful?

You can say:

> It reduces coupling, improves testability, makes implementations replaceable, and helps isolate business logic from infrastructure details.

---

# Common mistakes

A few important ones.

### Mistake 1: Creating an interface for everything

This:

```java
interface UserService
class UserServiceImpl
```

is not automatically good design.

There should be a useful abstraction boundary.

### Mistake 2: Interface still exposes implementation details

Bad:

```java
interface Repository {

    void executeSql(String sql);
}
```

Your business layer still knows SQL.

Better:

```java
interface OrderRepository {

    void save(Order order);
}
```

### Mistake 3: Service creates its own dependency

Even if an interface exists:

```java
class OrderService {

    private PaymentGateway gateway =
            new StripeGateway();
}
```

the service is still coupled to Stripe's construction.

Prefer:

```java
public OrderService(
        PaymentGateway gateway)
```

### Mistake 4: Giant dependency interfaces

DIP doesn't override ISP.

Don't create:

```java
interface ApplicationInfrastructure {

    void save();
    void email();
    void pay();
    void log();
    void cache();
    void upload();
}
```

Keep abstractions focused.

---

# The big picture

Here's the mental model I'd like you to remember:

```text
Without DIP:

Business Logic
      |
      v
MySQL
Stripe
Gmail
AWS
Filesystem
```

Your business code knows all infrastructure details.

With DIP:

```text
Business Logic
      |
      v
Stable Abstractions
      ^
      |
Infrastructure Implementations
```

For example:

```text
CheckoutService
      |
      +--> PaymentGateway <--- Stripe
      |
      +--> OrderRepository <--- MySQL
      |
      +--> NotificationSender <--- Gmail
```

The high-level business behavior stays stable while infrastructure can change around it.

That is one of the most important architectural ideas you'll learn.

# SOLID complete

You now know all five principles:

```text
S — Single Responsibility Principle
    One cohesive responsibility.

O — Open/Closed Principle
    Extend expected behavior without
    constantly modifying stable code.

L — Liskov Substitution Principle
    Subtypes must safely honor the
    parent's contract.

I — Interface Segregation Principle
    Clients should depend only on
    capabilities they actually need.

D — Dependency Inversion Principle
    Depend on abstractions rather than
    concrete implementation details.
```

A very useful compact mental model is:

```text
SRP → separate responsibilities

OCP → isolate variation

LSP → make polymorphism trustworthy

ISP → keep contracts focused

DIP → point dependencies toward abstractions
```

## Next step: Design Patterns

Now we're ready to start the actual design patterns.

I recommend we begin with **Creational Patterns**, but not with Singleton. A better learning order is:

```text
1. Factory Method
2. Abstract Factory
3. Builder
4. Prototype
5. Singleton
```

Starting with **Factory Method** is useful because it answers one of the biggest remaining questions from SOLID:

> We know we should depend on abstractions—but who decides which concrete object gets created?

That is where **Lesson 7 — Factory Method Pattern** begins.
