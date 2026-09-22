# Lesson 8 — Abstract Factory Pattern

Now we move from creating **one kind of object** to creating **families of related objects**.

That distinction is the heart of the **Abstract Factory Pattern**.

Suppose you're building a cross-platform desktop application.

Your UI needs:

```text
Button
Checkbox
Menu
```

But those components should look different depending on the operating system.

On Windows:

```text
WindowsButton
WindowsCheckbox
WindowsMenu
```

On macOS:

```text
MacButton
MacCheckbox
MacMenu
```

The important requirement is not just:

> Create a button.

It is:

> Create a consistent family of UI components.

If we're running on Windows, we want all Windows components.

If we're running on macOS, we want all Mac components.

We don't want this:

```text
WindowsButton
MacCheckbox
WindowsMenu
```

That's exactly the kind of problem Abstract Factory solves.

---

# Start with the bad design

Imagine:

```java
class Application {

    public void render(String os) {

        if (os.equals("WINDOWS")) {

            WindowsButton button =
                    new WindowsButton();

            WindowsCheckbox checkbox =
                    new WindowsCheckbox();

            button.render();
            checkbox.render();

        } else if (os.equals("MAC")) {

            MacButton button =
                    new MacButton();

            MacCheckbox checkbox =
                    new MacCheckbox();

            button.render();
            checkbox.render();
        }
    }
}
```

It works.

But `Application` knows about:

```text
WindowsButton
WindowsCheckbox
MacButton
MacCheckbox
```

So high-level application code is directly coupled to concrete UI implementations.

And as we add:

```text
Linux
Android
iOS
Web
```

the class keeps growing.

---

# First step — define product abstractions

Button:

```java
interface Button {

    void render();
}
```

Checkbox:

```java
interface Checkbox {

    void render();
}
```

Now the application can think in terms of:

```text
Button
Checkbox
```

rather than concrete classes.

---

# Concrete Windows products

```java
class WindowsButton
        implements Button {

    @Override
    public void render() {
        System.out.println(
            "Rendering Windows button"
        );
    }
}
```

```java
class WindowsCheckbox
        implements Checkbox {

    @Override
    public void render() {
        System.out.println(
            "Rendering Windows checkbox"
        );
    }
}
```

---

# Concrete Mac products

```java
class MacButton
        implements Button {

    @Override
    public void render() {
        System.out.println(
            "Rendering Mac button"
        );
    }
}
```

```java
class MacCheckbox
        implements Checkbox {

    @Override
    public void render() {
        System.out.println(
            "Rendering Mac checkbox"
        );
    }
}
```

Now we have two product hierarchies:

```text
Button
 ├── WindowsButton
 └── MacButton
```

and:

```text
Checkbox
 ├── WindowsCheckbox
 └── MacCheckbox
```

But we still need something to create the matching combinations.

---

# Enter Abstract Factory

We define:

```java
interface UIFactory {

    Button createButton();

    Checkbox createCheckbox();
}
```

This interface doesn't create one product.

It creates a **family of products**.

That's the defining idea.

---

# Windows factory

```java
class WindowsUIFactory
        implements UIFactory {

    @Override
    public Button createButton() {
        return new WindowsButton();
    }

    @Override
    public Checkbox createCheckbox() {
        return new WindowsCheckbox();
    }
}
```

Mac factory:

```java
class MacUIFactory
        implements UIFactory {

    @Override
    public Button createButton() {
        return new MacButton();
    }

    @Override
    public Checkbox createCheckbox() {
        return new MacCheckbox();
    }
}
```

Notice the consistency.

`WindowsUIFactory` always produces:

```text
WindowsButton
WindowsCheckbox
```

`MacUIFactory` always produces:

```text
MacButton
MacCheckbox
```

---

# Client code

Now our application becomes:

```java
class Application {

    private final UIFactory factory;

    public Application(UIFactory factory) {
        this.factory = factory;
    }

    public void render() {

        Button button =
                factory.createButton();

        Checkbox checkbox =
                factory.createCheckbox();

        button.render();
        checkbox.render();
    }
}
```

Usage:

```java
UIFactory factory =
        new WindowsUIFactory();

Application app =
        new Application(factory);

app.render();
```

Output:

```text
Rendering Windows button
Rendering Windows checkbox
```

Change to Mac:

```java
UIFactory factory =
        new MacUIFactory();

Application app =
        new Application(factory);

app.render();
```

Output:

```text
Rendering Mac button
Rendering Mac checkbox
```

What changed inside `Application`?

Nothing.

That's the important part.

---

# Structure of Abstract Factory

Conceptually:

```text
                 UIFactory
                 /       \
                /         \
 WindowsUIFactory       MacUIFactory
       |                    |
       |                    |
       v                    v
 WindowsButton          MacButton
 WindowsCheckbox        MacCheckbox
```

The client only knows:

```text
UIFactory
Button
Checkbox
```

It does not need to know:

```text
WindowsButton
MacButton
WindowsCheckbox
MacCheckbox
```

This is a very strong form of decoupling.

---

# Why not just use Factory Method?

This is the most important comparison.

Factory Method is usually centered around creating one product hierarchy.

For example:

```text
Transport
 ├── Truck
 └── Ship
```

with:

```java
createTransport()
```

Abstract Factory handles several related product types together.

For example:

```text
Button
Checkbox
Menu
```

across multiple families:

```text
Windows family
Mac family
Linux family
```

So a useful mental distinction is:

> **Factory Method: which product should I create?**

> **Abstract Factory: which family of related products should I create?**

---

# Another example — Furniture

Imagine a furniture store.

We sell:

```text
Chair
Sofa
CoffeeTable
```

But in different styles:

```text
Modern
Victorian
ArtDeco
```

We want:

```text
ModernChair
ModernSofa
ModernCoffeeTable
```

or:

```text
VictorianChair
VictorianSofa
VictorianCoffeeTable
```

We don't want:

```text
ModernChair
VictorianSofa
ArtDecoCoffeeTable
```

if the customer selected a consistent furniture collection.

So first define products.

```java
interface Chair {

    void sitOn();
}
```

```java
interface Sofa {

    void lieOn();
}
```

```java
interface CoffeeTable {

    void placeItem();
}
```

Now the factory:

```java
interface FurnitureFactory {

    Chair createChair();

    Sofa createSofa();

    CoffeeTable createCoffeeTable();
}
```

Modern factory:

```java
class ModernFurnitureFactory
        implements FurnitureFactory {

    public Chair createChair() {
        return new ModernChair();
    }

    public Sofa createSofa() {
        return new ModernSofa();
    }

    public CoffeeTable createCoffeeTable() {
        return new ModernCoffeeTable();
    }
}
```

Victorian factory:

```java
class VictorianFurnitureFactory
        implements FurnitureFactory {

    public Chair createChair() {
        return new VictorianChair();
    }

    public Sofa createSofa() {
        return new VictorianSofa();
    }

    public CoffeeTable createCoffeeTable() {
        return new VictorianCoffeeTable();
    }
}
```

Now the client receives:

```java
FurnitureFactory factory;
```

and gets a consistent family automatically.

---

# Why families matter

Suppose your code independently does this:

```java
Button button =
        buttonFactory.createButton();

Checkbox checkbox =
        checkboxFactory.createCheckbox();
```

If those factories are configured differently, you could accidentally create:

```text
WindowsButton
MacCheckbox
```

Abstract Factory groups related construction behind one object:

```java
UIFactory factory;
```

Then:

```java
factory.createButton();
factory.createCheckbox();
```

produce compatible variants.

That consistency guarantee is one of the pattern's biggest benefits.

---

# Another example — Database families

Imagine an application supporting:

```text
MySQL
PostgreSQL
```

and each database requires several related components:

```text
Connection
Command
Transaction
```

We could define:

```java
interface DatabaseConnection {

    void connect();
}
```

```java
interface DatabaseCommand {

    void execute();
}
```

```java
interface DatabaseTransaction {

    void commit();
}
```

Then:

```java
interface DatabaseFactory {

    DatabaseConnection createConnection();

    DatabaseCommand createCommand();

    DatabaseTransaction createTransaction();
}
```

MySQL factory:

```java
class MySQLFactory
        implements DatabaseFactory {

    public DatabaseConnection
        createConnection() {

        return new MySQLConnection();
    }

    public DatabaseCommand
        createCommand() {

        return new MySQLCommand();
    }

    public DatabaseTransaction
        createTransaction() {

        return new MySQLTransaction();
    }
}
```

PostgreSQL factory:

```java
class PostgreSQLFactory
        implements DatabaseFactory {

    public DatabaseConnection
        createConnection() {

        return new PostgreSQLConnection();
    }

    public DatabaseCommand
        createCommand() {

        return new PostgreSQLCommand();
    }

    public DatabaseTransaction
        createTransaction() {

        return new PostgreSQLTransaction();
    }
}
```

Now the application doesn't mix database-specific components.

---

# Where SOLID appears

Abstract Factory connects strongly to what we've learned.

With OCP, adding a new family such as:

```text
LinuxButton
LinuxCheckbox
LinuxMenu
```

can be done by introducing:

```java
class LinuxUIFactory
        implements UIFactory {
    ...
}
```

without changing the application.

With DIP, the application depends on:

```java
UIFactory
```

rather than:

```java
WindowsUIFactory
```

and depends on:

```java
Button
Checkbox
```

rather than concrete implementations.

LSP matters because every concrete product must genuinely honor its abstraction.

ISP matters because the factory itself should remain cohesive. If `UIFactory` starts creating databases, loggers, payment systems, HTTP clients, and UI widgets all together, it's becoming too broad.

---

# Abstract Factory and Dependency Injection

These patterns also work well with DI.

Suppose:

```java
class Application {

    private final UIFactory factory;

    public Application(UIFactory factory) {
        this.factory = factory;
    }
}
```

We could configure:

```java
UIFactory factory =
        new WindowsUIFactory();
```

and inject it.

Or a framework such as Spring could inject the correct implementation.

The application doesn't need to construct or select the concrete factory itself.

This is an important general architecture idea:

```text
configuration decides implementation
business logic uses abstraction
```

---

# Runtime selection

You may still need to choose the factory.

For example:

```java
UIFactory factory;

if (os.equals("WINDOWS")) {

    factory = new WindowsUIFactory();

} else if (os.equals("MAC")) {

    factory = new MacUIFactory();

} else {

    throw new IllegalArgumentException();
}
```

Isn't that still an `if`?

Yes.

And that's okay.

The difference is that selection happens once near the application's configuration or composition boundary.

The rest of the application doesn't repeatedly ask:

```text
Is this Windows?
Is this Mac?
```

That decision is centralized.

This is an important design principle:

> Conditionals aren't automatically bad. Repeated conditionals scattered across business logic are the bigger problem.

---

# Abstract Factory vs Simple Factory

Suppose:

```java
class NotificationFactory {

    Notification create(String type) {
        ...
    }
}
```

That's creating one product category:

```text
Notification
```

Abstract Factory usually has several creation methods:

```java
interface UIFactory {

    Button createButton();

    Checkbox createCheckbox();

    Menu createMenu();
}
```

Those products belong to the same family.

That's the difference.

---

# Abstract Factory vs Factory Method

Let's make this especially clear.

Factory Method might look like:

```java
abstract class Logistics {

    protected abstract Transport
        createTransport();
}
```

The method itself is overridden by subclasses.

Abstract Factory often uses an object representing a family:

```java
interface UIFactory {

    Button createButton();

    Checkbox createCheckbox();
}
```

Then concrete factory objects provide related products.

Interestingly, Abstract Factory implementations may internally use Factory Methods.

Patterns can compose.

They are not mutually exclusive.

---

# Abstract Factory vs Builder

This distinction will matter in Lesson 9.

Abstract Factory answers:

> Which family of objects should be created?

Builder answers:

> How do I construct one complex object step by step?

For example:

```text
Abstract Factory:
WindowsButton + WindowsCheckbox + WindowsMenu
```

versus:

```text
Builder:
Computer
  CPU
  RAM
  Storage
  GPU
  OS
```

Factory chooses related product variants.

Builder gradually assembles a complex object.

---

# When Abstract Factory is a good fit

Imagine your system has two dimensions:

```text
Product type
```

and:

```text
Product family
```

For example:

```text
             Windows       Mac

Button       WinButton     MacButton
Checkbox     WinCheckbox   MacCheckbox
Menu         WinMenu       MacMenu
```

That's a strong Abstract Factory signal.

Another:

```text
             AWS           Azure

Storage      S3            BlobStorage
Queue        SQS           ServiceBus
Database     RDS           AzureSQL
```

If your application needs a consistently configured cloud-provider family, an abstract factory can help.

---

# But don't force the pattern

Suppose you only need:

```java
new User();
```

You do not need:

```text
UserFactory
UserFactoryFactory
AbstractUserFactory
DefaultUserFactory
```

Similarly, if you have only one product type, Factory Method or a simple factory may be enough.

Abstract Factory becomes useful when **multiple related product types vary together**.

---

# A subtle downside

Suppose:

```java
interface UIFactory {

    Button createButton();

    Checkbox createCheckbox();
}
```

Adding a new family is easy.

For example:

```java
class LinuxUIFactory
        implements UIFactory
```

Great.

But what happens if we add a brand-new product type:

```text
Slider
```

We must change:

```java
interface UIFactory {

    Button createButton();

    Checkbox createCheckbox();

    Slider createSlider();
}
```

Now every factory must change:

```text
WindowsUIFactory
MacUIFactory
LinuxUIFactory
```

This is an important tradeoff.

Abstract Factory is excellent when:

> Families change frequently.

But less convenient when:

> Product categories change frequently.

Think in terms of a table:

```text
          Button   Checkbox   Slider

Windows      ✓        ✓         ✓
Mac          ✓        ✓         ✓
Linux        ✓        ✓         ✓
```

Adding a row:

```text
Android
```

is easy.

Adding a column:

```text
DatePicker
```

requires updating every family.

That's one of the pattern's main structural tradeoffs.

---

# Common mistake: giant abstract factory

Avoid this:

```java
interface ApplicationFactory {

    User createUser();

    Order createOrder();

    Database createDatabase();

    Logger createLogger();

    Button createButton();

    Payment createPayment();

    Email createEmail();
}
```

These things may have nothing to do with one coherent family.

An Abstract Factory should usually represent a related set of products.

For example:

```java
interface UIFactory
```

makes sense because:

```text
Button
Checkbox
Menu
```

are all UI components belonging to the same style/platform family.

---

# Another useful example — Game themes

Imagine a game supports:

```text
Medieval
SciFi
```

Each theme needs:

```text
Enemy
Weapon
Building
```

Product abstractions:

```java
interface Enemy {
    void attack();
}
```

```java
interface Weapon {
    void use();
}
```

```java
interface Building {
    void render();
}
```

Factory:

```java
interface GameFactory {

    Enemy createEnemy();

    Weapon createWeapon();

    Building createBuilding();
}
```

Medieval:

```java
class MedievalGameFactory
        implements GameFactory {

    public Enemy createEnemy() {
        return new Knight();
    }

    public Weapon createWeapon() {
        return new Sword();
    }

    public Building createBuilding() {
        return new Castle();
    }
}
```

Sci-fi:

```java
class SciFiGameFactory
        implements GameFactory {

    public Enemy createEnemy() {
        return new Alien();
    }

    public Weapon createWeapon() {
        return new LaserGun();
    }

    public Building createBuilding() {
        return new SpaceStation();
    }
}
```

Now selecting one factory automatically gives you a coherent game theme.

That's a very natural Abstract Factory use case.

---

# Interview definition

If an interviewer asks:

> What is Abstract Factory?

A strong answer is:

> Abstract Factory is a creational design pattern that provides an interface for creating families of related or compatible objects without exposing their concrete classes. Each concrete factory creates one consistent product family.

Then give the UI example:

> A `UIFactory` can create `Button` and `Checkbox` objects, while `WindowsUIFactory` creates Windows versions and `MacUIFactory` creates Mac versions. Client code works only with the factory and product abstractions.

That's a very solid answer.

---

# Factory Method vs Abstract Factory

Remember this mental model:

```text
Factory Method

Creator
   |
   v
createProduct()
   |
   v
One product hierarchy
```

versus:

```text
Abstract Factory

Factory
   |
   +--> createProductA()
   |
   +--> createProductB()
   |
   +--> createProductC()

All belonging to one family
```

Or even more simply:

```text
Factory Method
→ one product

Abstract Factory
→ product family
```

That's simplified, but very useful for interviews.

---

# Full example

Here is the complete UI version together:

```java
interface Button {

    void render();
}
```

```java
interface Checkbox {

    void render();
}
```

```java
class WindowsButton
        implements Button {

    public void render() {
        System.out.println(
            "Windows Button"
        );
    }
}
```

```java
class WindowsCheckbox
        implements Checkbox {

    public void render() {
        System.out.println(
            "Windows Checkbox"
        );
    }
}
```

```java
class MacButton
        implements Button {

    public void render() {
        System.out.println(
            "Mac Button"
        );
    }
}
```

```java
class MacCheckbox
        implements Checkbox {

    public void render() {
        System.out.println(
            "Mac Checkbox"
        );
    }
}
```

Factory:

```java
interface UIFactory {

    Button createButton();

    Checkbox createCheckbox();
}
```

```java
class WindowsUIFactory
        implements UIFactory {

    public Button createButton() {
        return new WindowsButton();
    }

    public Checkbox createCheckbox() {
        return new WindowsCheckbox();
    }
}
```

```java
class MacUIFactory
        implements UIFactory {

    public Button createButton() {
        return new MacButton();
    }

    public Checkbox createCheckbox() {
        return new MacCheckbox();
    }
}
```

Client:

```java
class Application {

    private final Button button;
    private final Checkbox checkbox;

    public Application(
            UIFactory factory) {

        button =
                factory.createButton();

        checkbox =
                factory.createCheckbox();
    }

    public void render() {

        button.render();
        checkbox.render();
    }
}
```

Main:

```java
public class Main {

    public static void main(String[] args) {

        UIFactory factory =
                new WindowsUIFactory();

        Application application =
                new Application(factory);

        application.render();
    }
}
```

Changing:

```java
new WindowsUIFactory();
```

to:

```java
new MacUIFactory();
```

changes the entire product family.

That's Abstract Factory in its cleanest form.

---

# What to remember

Keep these ideas in your head:

- **Factory Method** delegates creation of a product to subclasses; **Abstract Factory** creates a coordinated family of related products.
- Client code depends on abstract factories and abstract products, not concrete implementations.
- Abstract Factory is especially useful when several product types vary together, such as Windows/Mac UI components.
- Adding a new family is usually easy; adding a new product type can require changing every factory.
- Use it when consistency across related objects matters, not simply because object creation exists.

The core recognition question is:

> **Do several related product types need to vary together as one family?**

If yes, Abstract Factory is worth considering.

# Next: Lesson 9 — Builder Pattern

Builder solves a completely different creation problem.

Imagine this constructor:

```java
new Computer(
    "Intel i9",
    64,
    2000,
    true,
    true,
    "RTX 5090",
    "Windows",
    false
);
```

What does each parameter mean?

And what happens when an object has 15 optional properties?

The **Builder Pattern** helps us construct complex objects step by step:

```java
Computer computer =
    new Computer.Builder()
        .cpu("Intel i9")
        .ram(64)
        .storage(2000)
        .gpu("RTX 5090")
        .wifi(true)
        .build();
```

Lesson 9 will cover **Builder**, including telescoping constructors, immutability, fluent APIs, validation, Java records/Lombok considerations, and how Builder differs from Factory and Abstract Factory.
