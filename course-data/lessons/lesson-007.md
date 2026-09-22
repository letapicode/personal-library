# Lesson 7 — Factory Method Pattern

Now we move from **SOLID principles** into actual **design patterns**.

The first pattern is extremely important because it addresses a question you've already encountered several times:

> If my code depends on an interface, who creates the concrete object?

For example:

```java
PaymentGateway gateway =
        new StripePaymentGateway();
```

Somewhere, somebody still needs to write:

```java
new StripePaymentGateway()
```

Object creation itself can become a design problem.

That is where factories begin.

---

# 1. The problem

Imagine we're building a notification application.

We have:

```java
interface Notification {

    void send(String message);
}
```

Implementations:

```java
class EmailNotification
        implements Notification {

    @Override
    public void send(String message) {
        System.out.println(
            "EMAIL: " + message
        );
    }
}
```

```java
class SmsNotification
        implements Notification {

    @Override
    public void send(String message) {
        System.out.println(
            "SMS: " + message
        );
    }
}
```

Our application might do:

```java
Notification notification =
        new EmailNotification();

notification.send("Order shipped");
```

Nothing wrong yet.

But imagine object creation starts spreading everywhere:

```java
class OrderService {

    public void completeOrder() {

        Notification notification =
                new EmailNotification();

        notification.send(
            "Order completed"
        );
    }
}
```

Then:

```java
class RegistrationService {

    public void register() {

        Notification notification =
                new EmailNotification();

        notification.send(
            "Welcome!"
        );
    }
}
```

Then:

```java
class PasswordService {

    public void resetPassword() {

        Notification notification =
                new EmailNotification();

        notification.send(
            "Password reset"
        );
    }
}
```

Now many classes know:

```java
EmailNotification
```

instead of just knowing:

```java
Notification
```

We've coupled our application to a concrete class.

---

# Then requirements change

The product manager says:

> Some users prefer SMS.

Now code starts becoming:

```java
Notification notification;

if (type.equals("EMAIL")) {

    notification =
            new EmailNotification();

} else {

    notification =
            new SmsNotification();
}
```

Then we add:

```text
PUSH
WHATSAPP
SLACK
```

Soon this appears everywhere:

```java
if (type.equals("EMAIL")) {

    return new EmailNotification();

} else if (type.equals("SMS")) {

    return new SmsNotification();

} else if (type.equals("PUSH")) {

    return new PushNotification();

} else if (type.equals("WHATSAPP")) {

    return new WhatsAppNotification();
}
```

The main problem is:

> **Object-creation logic is leaking into business logic.**

---

# 2. First idea: separate creation

Let's create a class whose responsibility is object creation.

```java
class NotificationFactory {

    public Notification create(
            String type) {

        if (type.equals("EMAIL")) {
            return new EmailNotification();

        } else if (type.equals("SMS")) {
            return new SmsNotification();

        }

        throw new IllegalArgumentException(
            "Unknown notification type"
        );
    }
}
```

Now client code becomes:

```java
NotificationFactory factory =
        new NotificationFactory();

Notification notification =
        factory.create("EMAIL");

notification.send("Hello!");
```

That's already better.

The caller doesn't write:

```java
new EmailNotification()
```

It asks a factory.

---

# But wait — is that Factory Method?

This distinction is important.

What we just created is commonly called a:

> **Simple Factory**

or sometimes informally just:

> Factory

But the classic Gang of Four **Factory Method Pattern** is slightly different.

Factory Method uses **inheritance/polymorphism** so subclasses decide which concrete product should be created.

Let's build toward that.

---

# 3. Simple Factory first

Our simple factory looks like:

```java
class NotificationFactory {

    public Notification create(
            String type) {

        switch (type) {

            case "EMAIL":
                return new EmailNotification();

            case "SMS":
                return new SmsNotification();

            default:
                throw new IllegalArgumentException();
        }
    }
}
```

Structure:

```text
Client
   |
   v
NotificationFactory
   |
   +----> EmailNotification
   |
   +----> SmsNotification
```

The factory centralizes creation.

That's useful.

But notice something.

Every time we add a notification type:

```text
PushNotification
WhatsAppNotification
SlackNotification
```

we modify:

```java
NotificationFactory
```

So this factory may itself violate OCP as the number of variants grows.

---

# Factory Method goes further

Suppose we have some workflow that sends notifications.

Instead of asking a central factory to choose based on a string, we'll define an abstract creator.

```java
abstract class NotificationService {

    public abstract Notification
        createNotification();

    public void sendNotification(
            String message) {

        Notification notification =
                createNotification();

        notification.send(message);
    }
}
```

Look carefully.

`NotificationService` contains business workflow:

```java
sendNotification()
```

but it does **not** know which concrete notification gets created.

It calls:

```java
createNotification()
```

That method is the:

> **Factory Method**

---

# 4. Concrete creators

Email:

```java
class EmailNotificationService
        extends NotificationService {

    @Override
    public Notification
        createNotification() {

        return new EmailNotification();
    }
}
```

SMS:

```java
class SmsNotificationService
        extends NotificationService {

    @Override
    public Notification
        createNotification() {

        return new SmsNotification();
    }
}
```

Usage:

```java
NotificationService service =
        new EmailNotificationService();

service.sendNotification(
        "Your order has shipped"
);
```

Or:

```java
NotificationService service =
        new SmsNotificationService();

service.sendNotification(
        "Your OTP is 1234"
);
```

The parent class defines the workflow.

The subclass decides:

> Which concrete product should I create?

That's Factory Method.

---

# 5. The structure

Conceptually:

```text
                   Notification
                        ^
                        |
              ----------------------
              |                    |
     EmailNotification      SmsNotification


              NotificationService
                      ^
                      |
          -------------------------
          |                       |
EmailNotificationService   SmsNotificationService
```

And:

```text
NotificationService
        |
        |
        +-- createNotification()
        |
        +-- sendNotification()
```

Subclasses override:

```java
createNotification()
```

to create the proper object.

---

# 6. Why is it called Factory Method?

Because the factory is not necessarily an entire factory object.

The key is the method:

```java
createNotification()
```

That method is responsible for creating a product.

And subclasses override it.

Hence:

> **Factory Method**

---

# 7. General definition

The Factory Method Pattern:

> Defines an interface or abstract method for creating an object, while allowing subclasses to decide which concrete object gets instantiated.

In simpler terms:

> The parent defines **when an object is needed**.  
> The child decides **which object to create**.

That distinction is worth remembering.

---

# 8. Another example — Documents

Imagine a document application.

Product:

```java
interface Document {

    void open();
}
```

PDF:

```java
class PdfDocument
        implements Document {

    @Override
    public void open() {
        System.out.println(
            "Opening PDF"
        );
    }
}
```

Word:

```java
class WordDocument
        implements Document {

    @Override
    public void open() {
        System.out.println(
            "Opening Word document"
        );
    }
}
```

Now creator:

```java
abstract class DocumentApplication {

    protected abstract Document
        createDocument();

    public void openDocument() {

        Document document =
                createDocument();

        document.open();
    }
}
```

PDF creator:

```java
class PdfApplication
        extends DocumentApplication {

    @Override
    protected Document
        createDocument() {

        return new PdfDocument();
    }
}
```

Word creator:

```java
class WordApplication
        extends DocumentApplication {

    @Override
    protected Document
        createDocument() {

        return new WordDocument();
    }
}
```

Usage:

```java
DocumentApplication app =
        new PdfApplication();

app.openDocument();
```

Notice:

```java
openDocument()
```

doesn't know about:

```java
PdfDocument
```

It depends only on:

```java
Document
```

---

# 9. Where OCP appears

Suppose we add:

```java
class ExcelDocument
        implements Document {

    @Override
    public void open() {
        System.out.println(
            "Opening Excel document"
        );
    }
}
```

Then:

```java
class ExcelApplication
        extends DocumentApplication {

    @Override
    protected Document
        createDocument() {

        return new ExcelDocument();
    }
}
```

What did we change inside:

```java
DocumentApplication
```

?

Nothing.

So we extended the system without modifying the stable creator.

That's OCP.

---

# 10. Where DIP appears

Our high-level workflow:

```java
openDocument()
```

depends on:

```java
Document
```

not:

```java
PdfDocument
WordDocument
ExcelDocument
```

So DIP appears too.

We're depending on an abstraction.

---

# 11. Where LSP appears

We can use:

```java
Document document;
```

with:

```java
new PdfDocument()
new WordDocument()
new ExcelDocument()
```

provided all implementations honor the `Document` contract.

That's LSP.

Factory Method actually becomes easier to understand because you've already learned SOLID.

---

# 12. Real-world example — Logistics

This is a common Factory Method example.

Suppose we build logistics software.

Initially:

```java
class Logistics {

    public void deliver() {

        Truck truck =
                new Truck();

        truck.deliver();
    }
}
```

Then the company expands into shipping.

Now we need:

```text
Truck
Ship
```

Instead of tying logistics workflow directly to `Truck`, define:

```java
interface Transport {

    void deliver();
}
```

Truck:

```java
class Truck implements Transport {

    @Override
    public void deliver() {
        System.out.println(
            "Delivering by road"
        );
    }
}
```

Ship:

```java
class Ship implements Transport {

    @Override
    public void deliver() {
        System.out.println(
            "Delivering by sea"
        );
    }
}
```

Creator:

```java
abstract class Logistics {

    protected abstract Transport
        createTransport();

    public void planDelivery() {

        Transport transport =
                createTransport();

        transport.deliver();
    }
}
```

Road:

```java
class RoadLogistics
        extends Logistics {

    @Override
    protected Transport
        createTransport() {

        return new Truck();
    }
}
```

Sea:

```java
class SeaLogistics
        extends Logistics {

    @Override
    protected Transport
        createTransport() {

        return new Ship();
    }
}
```

Usage:

```java
Logistics logistics =
        new RoadLogistics();

logistics.planDelivery();
```

or:

```java
Logistics logistics =
        new SeaLogistics();

logistics.planDelivery();
```

The core delivery workflow doesn't care which transport exists.

---

# 13. Factory Method participants

There are four important roles to recognize:

```text
Product
    ↓
Transport

Concrete Products
    ↓
Truck
Ship

Creator
    ↓
Logistics

Concrete Creators
    ↓
RoadLogistics
SeaLogistics
```

For our notification example:

```text
Product
    Notification

Concrete Products
    EmailNotification
    SmsNotification

Creator
    NotificationService

Concrete Creators
    EmailNotificationService
    SmsNotificationService
```

If you can identify those four roles, you understand the basic Factory Method structure.

---

# 14. Factory Method vs direct construction

Direct:

```java
EmailNotification notification =
        new EmailNotification();
```

Client knows:

```text
exact concrete class
construction details
```

Factory Method:

```java
Notification notification =
        createNotification();
```

Client/workflow knows:

```text
only the abstraction
```

The creation decision has moved elsewhere.

---

# 15. Why not always use Factory Method?

Because it introduces more classes.

Instead of:

```java
new EmailNotification()
```

we might now have:

```text
Notification
EmailNotification

NotificationService
EmailNotificationService
```

That's additional complexity.

If object creation is trivial and unlikely to vary:

```java
User user =
        new User("Alice");
```

you probably don't need Factory Method.

Patterns exist to solve problems, not to decorate simple code.

---

# 16. Factory Method becomes useful when creation varies

Imagine creating a database connection involves:

```text
configuration
authentication
SSL
connection pooling
driver setup
environment differences
```

You don't want business classes knowing all of that.

Similarly:

```java
PaymentProcessor processor =
        new StripePaymentProcessor(
            apiKey,
            retryPolicy,
            logger,
            fraudService,
            httpClient
        );
```

Object creation can become significant.

Factories let you separate:

```text
using an object
```

from:

```text
constructing the object
```

That's the deeper idea.

---

# 17. Creation vs usage

This distinction is extremely important.

Bad coupling:

```java
class CheckoutService {

    public void checkout() {

        StripePaymentGateway gateway =
                new StripePaymentGateway();

        gateway.charge(100);
    }
}
```

One class knows both:

```text
how to create Stripe
how to use Stripe
```

Better separation:

```text
Creator
   ↓
creates PaymentGateway

CheckoutService
   ↓
uses PaymentGateway
```

Creation and usage don't necessarily belong together.

This idea appears repeatedly in creational patterns.

---

# 18. Factory Method and constructor complexity

Suppose:

```java
new DatabaseConnection(
    url,
    username,
    password,
    timeout,
    retryCount,
    sslCertificate,
    connectionPool,
    logger
);
```

Now every caller has to understand construction details.

A factory can hide them.

For example:

```java
interface DatabaseConnection {

    void connect();
}
```

Creator:

```java
abstract class DatabaseService {

    protected abstract DatabaseConnection
        createConnection();

    public void execute() {

        DatabaseConnection connection =
                createConnection();

        connection.connect();
    }
}
```

Different subclasses can create:

```text
MySQLConnection
PostgreSQLConnection
OracleConnection
```

without changing the business workflow.

---

# 19. Runtime choice vs subclass choice

Here's another important distinction.

In a **Simple Factory**, choice often happens using runtime data:

```java
factory.create("EMAIL");
```

Inside:

```java
switch (type)
```

In classic **Factory Method**, choice often happens through the concrete creator type:

```java
NotificationService service =
        new EmailNotificationService();
```

Then polymorphism decides:

```java
service.createNotification();
```

So:

```text
Simple Factory
    → central selection logic

Factory Method
    → polymorphic subclass selection
```

This distinction is frequently asked in interviews.

---

# 20. Simple Factory isn't "bad"

Don't conclude:

> Factory Method is always better than Simple Factory.

No.

Simple Factory can be perfectly reasonable:

```java
class ParserFactory {

    public Parser create(FileType type) {

        return switch (type) {

            case JSON -> new JsonParser();
            case XML  -> new XmlParser();
            case CSV  -> new CsvParser();
        };
    }
}
```

This is simple and readable.

If formats rarely change, this may be all you need.

Factory Method makes more sense when creator behavior itself varies or subclasses naturally own the creation decision.

---

# 21. Factory Method vs Strategy

You've already seen Strategy-like designs, so this distinction matters.

Strategy answers:

> Which behavior/algorithm should I use?

Example:

```java
interface DiscountStrategy {

    double calculate(double amount);
}
```

Factory Method answers:

> Which object should I create?

Example:

```java
protected abstract Notification
    createNotification();
```

Often they work together.

A factory may create a strategy:

```java
DiscountStrategy strategy =
        strategyFactory.create(customerType);
```

Then Strategy controls behavior.

Factory controls creation.

---

# 22. Factory Method vs Dependency Injection

Another common confusion.

Factory:

```java
PaymentGateway gateway =
        factory.createGateway();
```

The class actively asks for an object.

Dependency injection:

```java
public CheckoutService(
        PaymentGateway gateway) {

    this.gateway = gateway;
}
```

The dependency is supplied from outside.

They can coexist.

For example, a DI container such as Spring effectively acts as a sophisticated object creation and wiring mechanism.

But the concepts are different.

---

# 23. Factory Method in frameworks

Factory patterns appear throughout real software.

Consider a framework that defines:

```java
abstract class Framework {

    protected abstract Component
        createComponent();

    public void run() {

        Component component =
                createComponent();

        component.execute();
    }
}
```

Your application provides:

```java
class MyFramework
        extends Framework {

    @Override
    protected Component
        createComponent() {

        return new MyComponent();
    }
}
```

The framework controls the workflow.

Your subclass supplies specific objects.

This pattern is common in extensible frameworks.

---

# 24. Template Method relationship

Look closely:

```java
public void sendNotification(
        String message) {

    Notification notification =
            createNotification();

    notification.send(message);
}
```

The overall workflow is defined in the parent.

One step:

```java
createNotification()
```

is delegated to subclasses.

This begins to resemble another pattern:

> **Template Method**

Factory Method and Template Method are often used together.

We'll study Template Method later.

For now remember:

> Factory Method varies object creation.

---

# 25. What Factory Method gives us

The major benefits are:

- It separates object creation from object usage.
- Client code can depend on abstractions instead of concrete classes.
- New product types can often be introduced without modifying stable creator logic.
- Construction logic can be centralized or specialized.
- Testing becomes easier because concrete products can be substituted.

But there is a cost: more abstractions and often more classes. Use it when object creation is genuinely variable or complex.

---

# 26. Common mistakes

### Mistake: calling every static creator a Factory Method

For example:

```java
NotificationFactory.create("EMAIL");
```

is certainly factory-style code, but it is not necessarily the classic GoF Factory Method Pattern.

Factory Method specifically emphasizes polymorphic creation through an overridable method.

### Mistake: giant factory

You may end up with:

```java
class EverythingFactory {

    User createUser();
    Payment createPayment();
    Invoice createInvoice();
    Database createDatabase();
    Email createEmail();
}
```

That becomes another god object.

Factories should still have cohesive responsibilities.

### Mistake: factories for trivial objects

Don't replace:

```java
new Point(10, 20);
```

with:

```java
PointCreationFactoryProviderManager
```

unless there is an actual creation problem.

---

# 27. Interview question

If an interviewer asks:

> What is Factory Method?

A strong answer would be:

> Factory Method is a creational design pattern that defines a method for creating objects while allowing subclasses to decide which concrete product gets instantiated. It separates object creation from the code that uses the product, allowing the client to work with abstractions instead of concrete implementations.

Then give an example:

> A `Logistics` class can define `createTransport()`, while `RoadLogistics` returns a `Truck` and `SeaLogistics` returns a `Ship`. The main delivery workflow uses only the `Transport` abstraction.

That's a strong answer.

---

# 28. Factory Method mental model

Remember this:

```text
Creator
   |
   | calls
   v
factoryMethod()
   |
   | returns
   v
Product
```

Then subclasses decide:

```text
ConcreteCreatorA
       |
       v
ConcreteProductA


ConcreteCreatorB
       |
       v
ConcreteProductB
```

Or in our example:

```text
NotificationService
       |
       v
createNotification()
       |
       v
Notification
```

And:

```text
EmailNotificationService
       |
       v
EmailNotification
```

---

# 29. Mini exercise

Imagine you're building a file parser.

You have:

```java
interface Parser {

    void parse(String file);
}
```

Implementations:

```text
JsonParser
XmlParser
CsvParser
```

Your application workflow is:

```java
abstract class ImportService {

    protected abstract Parser
        createParser();

    public void importFile(
            String file) {

        Parser parser =
                createParser();

        parser.parse(file);
    }
}
```

Your task mentally is to design:

```text
JsonImportService
XmlImportService
CsvImportService
```

Each should override:

```java
createParser()
```

and return the matching parser.

If you can build that without looking back, you've understood the core Factory Method idea.

---

# What we learned

Factory Method is fundamentally about this separation:

```text
Object creation
      ↓
separate from
      ↓
Object usage
```

And it builds directly on what we learned in SOLID:

```text
OCP → new products through extension

DIP → clients depend on Product abstraction

LSP → concrete products honor Product contract

SRP → creation logic separated from usage logic
```

The most important question to ask when recognizing this pattern is:

> **Is my client responsible for knowing exactly which concrete class to instantiate?**

If that responsibility is creating coupling or complexity, a factory may help.

# Lesson 8 — Abstract Factory

Next we'll go one level deeper.

Factory Method usually helps us create **one product hierarchy**:

```text
Transport
 ├── Truck
 └── Ship
```

But imagine you're building a cross-platform UI and need entire **families of related objects**:

```text
WindowsButton
WindowsCheckbox
WindowsMenu

MacButton
MacCheckbox
MacMenu
```

You don't want to accidentally combine:

```text
WindowsButton + MacCheckbox
```

The **Abstract Factory Pattern** solves that problem.

Its core question is:

> **How do I create families of related objects without coupling my application to their concrete classes?**

That is Lesson 8.
