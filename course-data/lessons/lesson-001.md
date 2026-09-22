# Lesson 1 — What is Software Design?

Suppose somebody tells you:

> "Build a payment system."

You could immediately start writing:

```java
public class PaymentService {

    public void pay(String type, double amount) {

        if (type.equals("CARD")) {
            System.out.println("Processing card payment");
        } else if (type.equals("PAYPAL")) {
            System.out.println("Processing PayPal payment");
        } else if (type.equals("UPI")) {
            System.out.println("Processing UPI payment");
        }
    }
}
```

It works.

So what's wrong?

Nothing—**yet**.

Now imagine the product manager comes back:

> Add Apple Pay.

You change the class:

```java
else if (type.equals("APPLE_PAY")) {
    ...
}
```

Then:

> Add crypto.

Another `if`.

Then:

> Card payments need fraud detection.

More code.

Then:

> PayPal needs retry logic.

More code.

Eventually:

```java
public void pay(String type, double amount) {

    if (type.equals("CARD")) {

        // validate
        // fraud detection
        // card API
        // retries
        // logging

    } else if (type.equals("PAYPAL")) {

        // paypal validation
        // paypal API
        // retries

    } else if (...) {
        ...
    }
}
```

Your program still works.

But your **design** is getting worse.

That's the fundamental problem design patterns try to solve.

---

# What does "good software design" mean?

Good software isn't merely code that works.

Imagine two programs both produce the same output.

Program A:

```text
5000 lines
everything depends on everything
changing one feature breaks three others
testing is difficult
```

Program B:

```text
small focused classes
clear interfaces
low dependencies
features can be replaced independently
easy testing
```

Both may be functionally correct.

But B has better **design**.

We generally want software that is:

**Maintainable**

You can understand and modify it.

**Extensible**

Adding a new feature doesn't require rewriting everything.

**Testable**

Components can be tested independently.

**Reusable**

Useful components can work elsewhere.

**Flexible**

Implementations can be replaced.

And two extremely important concepts help determine whether you're achieving this:

> **Cohesion** and **Coupling**

---

# 1. Cohesion

Cohesion asks:

> How closely related are the responsibilities inside this class?

Consider:

```java
class UserManager {

    void createUser() {}

    void sendEmail() {}

    void generateInvoice() {}

    void resizeImage() {}

    void calculateTax() {}
}
```

This class is doing unrelated things.

It has **low cohesion**.

Compare:

```java
class UserService {

    void createUser() {}
    void updateUser() {}
    void deleteUser() {}
}
```

Those responsibilities belong together.

That's **high cohesion**.

A useful rule:

> A class should have a focused purpose.

High cohesion = usually good.

---

# 2. Coupling

Coupling means:

> How dependent is one component on another?

Consider:

```java
class OrderService {

    private MySQLDatabase database = new MySQLDatabase();

    void createOrder() {
        database.save();
    }
}
```

`OrderService` directly depends on:

```java
MySQLDatabase
```

Imagine tomorrow the company decides to use PostgreSQL.

Or MongoDB.

Or an in-memory database during tests.

`OrderService` must change.

That's **tight coupling**.

A better approach:

```java
interface Database {

    void save();
}
```

Implementations:

```java
class MySQLDatabase implements Database {

    public void save() {
        System.out.println("Saving to MySQL");
    }
}
```

```java
class PostgreSQLDatabase implements Database {

    public void save() {
        System.out.println("Saving to PostgreSQL");
    }
}
```

Now:

```java
class OrderService {

    private Database database;

    public OrderService(Database database) {
        this.database = database;
    }

    void createOrder() {
        database.save();
    }
}
```

And:

```java
Database db = new PostgreSQLDatabase();

OrderService service = new OrderService(db);
```

Notice something important.

`OrderService` doesn't know whether it's talking to:

```text
MySQL
PostgreSQL
MongoDB
FakeDatabase
```

It knows only:

```java
Database
```

This idea is at the heart of modern object-oriented design.

---

# Programming to an interface

You'll hear this sentence constantly:

> **Program to an interface, not an implementation.**

It doesn't mean:

> "Use Java interfaces everywhere."

It means your code should depend on **capabilities/contracts**, rather than unnecessary implementation details.

Instead of:

```java
MySQLDatabase database;
```

prefer something like:

```java
Database database;
```

Instead of:

```java
ArrayList<String> names;
```

often prefer:

```java
List<String> names;
```

Why?

Because now the implementation can change.

```java
List<String> names = new ArrayList<>();
```

could later become:

```java
List<String> names = new LinkedList<>();
```

The rest of your code doesn't care.

---

# Abstraction

Suppose you're driving a car.

You use:

```text
steering wheel
accelerator
brake
gear selector
```

You don't interact directly with:

```text
fuel injectors
engine timing
transmission hydraulics
combustion chambers
```

The car gives you a simplified interface.

That's **abstraction**.

Software works similarly.

Consider:

```java
interface PaymentGateway {

    void pay(double amount);
}
```

The caller sees:

```java
gateway.pay(100);
```

It doesn't need to know:

```text
HTTP calls
authentication
JSON serialization
retry logic
TLS
bank protocols
```

Those details are hidden behind an abstraction.

---

# Encapsulation

Encapsulation means keeping an object's internal state controlled.

Bad:

```java
class BankAccount {

    public double balance;
}
```

Anyone can do:

```java
account.balance = -1000000;
```

Better:

```java
class BankAccount {

    private double balance;

    public void deposit(double amount) {

        if (amount <= 0) {
            throw new IllegalArgumentException();
        }

        balance += amount;
    }

    public double getBalance() {
        return balance;
    }
}
```

Now the object protects its own rules.

That's encapsulation.

---

# Inheritance

Suppose:

```java
class Animal {

    void eat() {
        System.out.println("Eating");
    }
}
```

Then:

```java
class Dog extends Animal {

    void bark() {
        System.out.println("Bark");
    }
}
```

`Dog` inherits behavior from `Animal`.

Inheritance describes an:

> **IS-A relationship**

A dog **is an** animal.

But developers often overuse inheritance.

Consider:

```java
class PaymentProcessor {

    void processPayment() {}
}
```

Then:

```java
class LoggingPaymentProcessor extends PaymentProcessor {
}
```

Then:

```java
class SecureLoggingPaymentProcessor
        extends LoggingPaymentProcessor {
}
```

Then:

```java
class RetrySecureLoggingPaymentProcessor
        extends SecureLoggingPaymentProcessor {
}
```

You can quickly create horrible class hierarchies.

Which leads to one of the most important principles in design patterns:

> **Favor composition over inheritance.**

---

# Composition

Composition represents a:

> **HAS-A relationship**

For example:

```java
class Car {

    private Engine engine;
}
```

A car **has an** engine.

Instead of creating:

```text
LoggingPaymentProcessor
RetryLoggingPaymentProcessor
SecureRetryLoggingPaymentProcessor
```

we might compose behaviors:

```java
class PaymentService {

    private PaymentProcessor processor;
    private Logger logger;
    private FraudChecker fraudChecker;
}
```

Each component handles a separate responsibility.

This makes combinations much easier.

Composition is incredibly important because many design patterns rely on it.

Examples include:

```text
Strategy
Decorator
Bridge
Observer
Command
State
```

---

# Polymorphism

Polymorphism means:

> Different objects can respond to the same interface in different ways.

Consider:

```java
interface PaymentMethod {

    void pay(double amount);
}
```

Implementation one:

```java
class CreditCardPayment implements PaymentMethod {

    public void pay(double amount) {
        System.out.println(
            "Paid $" + amount + " using credit card"
        );
    }
}
```

Implementation two:

```java
class PayPalPayment implements PaymentMethod {

    public void pay(double amount) {
        System.out.println(
            "Paid $" + amount + " using PayPal"
        );
    }
}
```

Now:

```java
PaymentMethod method;

method = new CreditCardPayment();
method.pay(100);

method = new PayPalPayment();
method.pay(100);
```

Same interface:

```java
pay()
```

Different behavior.

That's polymorphism.

And it is one of the most important mechanisms behind design patterns.

---

# The real problem patterns solve

Return to our original payment example:

```java
if (type.equals("CARD")) {
    ...
} else if (type.equals("PAYPAL")) {
    ...
} else if (type.equals("UPI")) {
    ...
}
```

Using polymorphism:

```java
interface PaymentMethod {

    void pay(double amount);
}
```

Implementations:

```java
class CardPayment implements PaymentMethod {

    public void pay(double amount) {
        System.out.println("Card payment");
    }
}
```

```java
class PayPalPayment implements PaymentMethod {

    public void pay(double amount) {
        System.out.println("PayPal payment");
    }
}
```

```java
class UpiPayment implements PaymentMethod {

    public void pay(double amount) {
        System.out.println("UPI payment");
    }
}
```

Now our service becomes:

```java
class PaymentService {

    private PaymentMethod paymentMethod;

    PaymentService(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    void checkout(double amount) {
        paymentMethod.pay(amount);
    }
}
```

Usage:

```java
PaymentMethod method =
        new CardPayment();

PaymentService service =
        new PaymentService(method);

service.checkout(100);
```

Tomorrow we add Bitcoin:

```java
class BitcoinPayment implements PaymentMethod {

    public void pay(double amount) {
        System.out.println("Bitcoin payment");
    }
}
```

Notice what we **didn't** change:

```java
PaymentService
```

That is a major sign of good extensible design.

And we've actually stumbled into our first design pattern:

> **Strategy Pattern**

We'll study it properly later.

---

# So what exactly is a Design Pattern?

A design pattern is **not a piece of code**.

It is a reusable **design idea** for solving a recurring software-design problem.

For example:

Problem:

> My program supports several interchangeable algorithms.

Potential solution:

> Strategy Pattern

Problem:

> Object creation is complicated and shouldn't be scattered throughout the code.

Potential solutions:

> Factory / Builder

Problem:

> I want to add behavior to objects without modifying their original classes.

Potential solution:

> Decorator

Problem:

> Multiple objects need to know when another object changes.

Potential solution:

> Observer

Problem:

> An object's behavior depends heavily on its current state.

Potential solution:

> State

Patterns give names to these recurring solutions.

---

# Why naming patterns matters

Suppose you're talking to another engineer and say:

> "We'll create an interface representing different pricing algorithms, implement each pricing calculation separately, and inject whichever algorithm the customer requires."

That's correct, but lengthy.

Once both developers understand patterns, you can simply say:

> "Let's use Strategy for pricing."

The architecture becomes immediately understandable.

That is why patterns create a **shared vocabulary** among engineers.

---

# Three major categories

The classic Gang of Four patterns are divided into three groups.

### Creational patterns

Concerned with:

> **How objects are created**

Examples:

```text
Factory
Abstract Factory
Builder
Prototype
Singleton
```

Think:

> "Creating this object is becoming complicated."

---

### Structural patterns

Concerned with:

> **How classes and objects are connected**

Examples:

```text
Adapter
Decorator
Facade
Composite
Bridge
Proxy
Flyweight
```

Think:

> "How should these pieces fit together?"

---

### Behavioral patterns

Concerned with:

> **How objects communicate and divide responsibilities**

Examples:

```text
Strategy
Observer
Command
State
Template Method
Chain of Responsibility
Mediator
Visitor
Iterator
Memento
```

Think:

> "Who should perform this behavior, and how should objects collaborate?"

---

# A mental model worth remembering

Don't think:

```text
Pattern → where can I use it?
```

Instead think:

```text
Problem
  ↓
Design forces
  ↓
Possible solutions
  ↓
Pattern
```

For example:

```text
Requirement:
We support multiple discount algorithms.

Problem:
Discount logic keeps changing.

Bad solution:
Huge if/else statement.

Observation:
The algorithms are interchangeable.

Design:
Represent each algorithm behind a common interface.

Pattern:
Strategy.
```

That reasoning is much more valuable than memorizing:

> "Strategy Pattern uses an interface."

---

# Patterns are not automatically good

A common beginner mistake is:

> "More design patterns = better architecture."

No.

This:

```java
int add(int a, int b) {
    return a + b;
}
```

doesn't need:

```text
AdditionFactory
AdditionStrategy
AdditionCommand
AdditionFacade
AdditionManager
AdditionSingleton
```

Patterns introduce abstractions.

Abstractions have a cost.

More:

```text
classes
interfaces
indirection
concepts
files
relationships
```

So the rule is:

> **Use a pattern when it simplifies an actual design problem.**

Not merely because you know the pattern.

---

# Your first design instinct

Whenever you encounter changing requirements, ask:

> **What is changing?**

Suppose:

```java
calculateShipping()
```

contains:

```text
FedEx
UPS
DHL
USPS
```

The thing changing is:

> Shipping algorithm.

That tells us it might deserve its own abstraction.

Suppose:

```text
Email
SMS
Push notification
WhatsApp
```

The thing changing is:

> Notification mechanism.

Again, abstraction may help.

A major skill in software design is learning to:

> **Separate things that change from things that stay stable.**

This idea appears again and again throughout design patterns.

---

# Before design patterns: five ideas to master

Keep these five principles in your head:

```text
1. High cohesion
2. Low coupling
3. Program to abstractions
4. Favor composition over inheritance
5. Encapsulate things that vary
```

You'll see these repeatedly.

For example:

```text
Strategy
    → encapsulates algorithms

Factory
    → encapsulates object creation

State
    → encapsulates state-dependent behavior

Observer
    → decouples publisher from subscribers

Adapter
    → isolates incompatible interfaces

Decorator
    → composes additional behavior
```

Patterns aren't unrelated tricks.

They're different applications of a relatively small number of good-design principles.

---

# Mini exercise

Imagine we're creating notifications.

Initial code:

```java
class NotificationService {

    void send(String type, String message) {

        if (type.equals("EMAIL")) {
            System.out.println(
                "Sending email: " + message
            );

        } else if (type.equals("SMS")) {
            System.out.println(
                "Sending SMS: " + message
            );

        } else if (type.equals("PUSH")) {
            System.out.println(
                "Sending push: " + message
            );
        }
    }
}
```

Think about these questions:

1. What part of the system is changing?
2. Is `NotificationService` tightly coupled to notification types?
3. Could we create an abstraction?
4. What might the interface look like?
5. How would WhatsApp notifications be added without modifying `NotificationService`?

A potential interface would begin:

```java
interface NotificationSender {

    void send(String message);
}
```

Don't worry about the complete solution yet. Being able to identify **what varies** is the important part.

---

# What you've learned in Lesson 1

You should now have this mental hierarchy:

```text
Software Design
│
├── Encapsulation
├── Abstraction
├── Polymorphism
├── Inheritance
├── Composition
│
├── High Cohesion
├── Low Coupling
│
└── Design Principles
        ↓
       SOLID
        ↓
   Design Patterns
        ↓
   Low-Level Design
```

And perhaps the most important sentence from this lesson is:

> **Design patterns are reusable ways of organizing objects and responsibilities to solve recurring design problems.**

The next step should be **SOLID**, beginning with the **Single Responsibility Principle**, because SOLID gives us the reasoning framework that makes patterns much easier to understand. After SOLID, we'll implement the patterns one by one in Java, including the bad design, the refactoring, the final implementation, UML-style structure, real-world uses, tradeoffs, common mistakes, and interview questions for each pattern.
