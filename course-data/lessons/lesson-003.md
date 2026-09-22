# Lesson 3 — Open/Closed Principle

The **Open/Closed Principle**, usually called **OCP**, says:

> Software entities should be **open for extension, but closed for modification**.

That sounds abstract, so translate it into something practical:

> You should be able to add new behavior without repeatedly changing stable, existing code.

This does **not** mean existing code can literally never change.

It means we should design parts of the system so that expected variations can often be added through extension rather than by constantly editing a giant `if/else` or `switch`.

---

# Start with a bad example

Imagine a payment system:

```java
class PaymentService {

    public void pay(String type, double amount) {

        if (type.equals("CARD")) {
            System.out.println("Paying by card");

        } else if (type.equals("PAYPAL")) {
            System.out.println("Paying by PayPal");

        } else if (type.equals("UPI")) {
            System.out.println("Paying by UPI");
        }
    }
}
```

Initially this works.

Then the business says:

> Add Apple Pay.

You modify the class:

```java
else if (type.equals("APPLE_PAY")) {
    System.out.println("Paying by Apple Pay");
}
```

Then:

> Add Bitcoin.

You modify it again.

Then:

> Add bank transfer.

Modify it again.

So every new payment type requires changing:

```java
PaymentService
```

That is the problem OCP is trying to reduce.

---

# Why repeated modification is dangerous

Imagine this is production code.

Every time you edit it, you might accidentally break:

```text
Card payments
PayPal payments
UPI payments
Apple Pay
other existing logic
```

So the risk increases as the class grows.

The structure becomes something like:

```text
PaymentService
│
├── CARD
├── PAYPAL
├── UPI
├── APPLE_PAY
├── BITCOIN
├── BANK_TRANSFER
└── ...
```

One class keeps accumulating knowledge about every variation.

That's usually a sign that the varying behavior needs its own abstraction.

---

# Ask the key question

Remember the question from Lesson 1:

> **What is changing?**

Here, the changing part is:

> The payment behavior.

So let's separate it.

---

# Step 1 — Create an abstraction

```java
interface PaymentMethod {

    void pay(double amount);
}
```

This defines the contract.

Any payment method must know how to:

```java
pay(amount)
```

---

# Step 2 — Create implementations

Card:

```java
class CardPayment implements PaymentMethod {

    @Override
    public void pay(double amount) {
        System.out.println(
            "Paid $" + amount + " using card"
        );
    }
}
```

PayPal:

```java
class PayPalPayment implements PaymentMethod {

    @Override
    public void pay(double amount) {
        System.out.println(
            "Paid $" + amount + " using PayPal"
        );
    }
}
```

UPI:

```java
class UpiPayment implements PaymentMethod {

    @Override
    public void pay(double amount) {
        System.out.println(
            "Paid $" + amount + " using UPI"
        );
    }
}
```

---

# Step 3 — Depend on the abstraction

Now:

```java
class PaymentService {

    private PaymentMethod paymentMethod;

    public PaymentService(
            PaymentMethod paymentMethod) {

        this.paymentMethod = paymentMethod;
    }

    public void checkout(double amount) {
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

Now imagine we add Bitcoin.

We create:

```java
class BitcoinPayment implements PaymentMethod {

    @Override
    public void pay(double amount) {
        System.out.println(
            "Paid $" + amount + " using Bitcoin"
        );
    }
}
```

What did we change inside `PaymentService`?

Nothing.

That's the important part.

---

# Open for extension

We extended the system:

```text
CardPayment
PayPalPayment
UpiPayment
BitcoinPayment
```

by adding another implementation.

So the system is:

> **Open for extension**

---

# Closed for modification

We did not need to edit:

```java
PaymentService
```

So `PaymentService` is largely:

> **Closed for modification**

That is OCP.

---

# Before vs after

Before:

```text
PaymentService
    |
    |-- if CARD
    |-- if PAYPAL
    |-- if UPI
    |-- if APPLE_PAY
    |-- if BITCOIN
```

After:

```text
               PaymentMethod
                    ^
                    |
        -------------------------
        |          |            |
    CardPayment PayPalPayment UpiPayment
                    |
               BitcoinPayment
```

And:

```text
PaymentService
       |
       v
 PaymentMethod
```

`PaymentService` doesn't care which implementation it receives.

---

# Very important connection

Notice that OCP naturally leads us toward:

```text
interfaces
polymorphism
composition
dependency injection
```

These are not isolated ideas.

They reinforce each other.

---

# Another example — Discount system

Suppose we have:

```java
class DiscountCalculator {

    public double calculate(
            String customerType,
            double price) {

        if (customerType.equals("REGULAR")) {
            return price * 0.95;

        } else if (customerType.equals("PREMIUM")) {
            return price * 0.90;

        } else if (customerType.equals("VIP")) {
            return price * 0.80;
        }

        return price;
    }
}
```

Again, every new customer type requires modification.

Suppose tomorrow:

```text
STUDENT
EMPLOYEE
PARTNER
WHOLESALE
```

are added.

This class keeps changing.

---

# OCP-style solution

Create:

```java
interface DiscountStrategy {

    double apply(double price);
}
```

Regular:

```java
class RegularDiscount
        implements DiscountStrategy {

    public double apply(double price) {
        return price * 0.95;
    }
}
```

Premium:

```java
class PremiumDiscount
        implements DiscountStrategy {

    public double apply(double price) {
        return price * 0.90;
    }
}
```

VIP:

```java
class VipDiscount
        implements DiscountStrategy {

    public double apply(double price) {
        return price * 0.80;
    }
}
```

Calculator:

```java
class DiscountCalculator {

    private DiscountStrategy strategy;

    public DiscountCalculator(
            DiscountStrategy strategy) {

        this.strategy = strategy;
    }

    public double calculate(double price) {
        return strategy.apply(price);
    }
}
```

Usage:

```java
DiscountStrategy strategy =
        new VipDiscount();

DiscountCalculator calculator =
        new DiscountCalculator(strategy);

double finalPrice =
        calculator.calculate(1000);
```

Now adding:

```java
class StudentDiscount
        implements DiscountStrategy {

    public double apply(double price) {
        return price * 0.85;
    }
}
```

doesn't require changing the existing calculator.

---

# You just saw Strategy Pattern again

Notice this structure:

```text
DiscountStrategy
      ^
      |
 -----------------------
 |          |          |
Regular   Premium      VIP
```

That's essentially the **Strategy Pattern**.

This is why SOLID comes before design patterns.

Once you understand the design problem, patterns stop looking like arbitrary diagrams.

You start thinking:

> "I have behavior that varies. I want to add new variations without modifying the client."

That naturally leads toward Strategy.

---

# Another example — Shapes

Here's a classic bad OCP example:

```java
class AreaCalculator {

    public double calculate(Object shape) {

        if (shape instanceof Circle) {

            Circle circle = (Circle) shape;

            return Math.PI
                    * circle.radius
                    * circle.radius;

        } else if (shape instanceof Rectangle) {

            Rectangle rectangle =
                    (Rectangle) shape;

            return rectangle.width
                    * rectangle.height;
        }

        return 0;
    }
}
```

What happens when we add:

```text
Triangle
Square
Ellipse
Polygon
```

We modify `AreaCalculator` every time.

---

# Better approach

```java
interface Shape {

    double area();
}
```

Circle:

```java
class Circle implements Shape {

    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    public double area() {
        return Math.PI * radius * radius;
    }
}
```

Rectangle:

```java
class Rectangle implements Shape {

    private double width;
    private double height;

    public Rectangle(
            double width,
            double height) {

        this.width = width;
        this.height = height;
    }

    public double area() {
        return width * height;
    }
}
```

Then:

```java
class AreaCalculator {

    public double calculate(Shape shape) {
        return shape.area();
    }
}
```

Add triangle:

```java
class Triangle implements Shape {

    private double base;
    private double height;

    public Triangle(
            double base,
            double height) {

        this.base = base;
        this.height = height;
    }

    public double area() {
        return 0.5 * base * height;
    }
}
```

`AreaCalculator` still doesn't change.

That's polymorphism doing the work.

---

# OCP does not mean "never use if statements"

This is important.

Some beginners hear OCP and conclude:

> `if` statements are bad.

That's incorrect.

This is perfectly fine:

```java
if (age >= 18) {
    allowAccess();
}
```

You don't need to create:

```text
AdultAccessStrategy
MinorAccessStrategy
AccessFactory
AgePolicyDecorator
```

just to remove an `if`.

The issue is not the existence of conditionals.

The warning sign is more like:

```java
if (type == A) {
    behaviorA();
} else if (type == B) {
    behaviorB();
} else if (type == C) {
    behaviorC();
}
```

especially when:

> new types are expected to keep appearing.

Then polymorphism may be a better design.

---

# How to recognize an OCP problem

Look for code that frequently changes because new variants keep appearing.

Common smells include:

```text
Huge switch statements
Huge if/else chains
instanceof checks everywhere
hardcoded type comparisons
repeated modifications for every new feature type
```

Example:

```java
switch (notificationType) {

    case "EMAIL":
        ...

    case "SMS":
        ...

    case "PUSH":
        ...

    case "WHATSAPP":
        ...
}
```

Ask:

> Are notification mechanisms expected to keep growing?

If yes, this may deserve an abstraction.

---

# Notification example

Bad:

```java
class NotificationService {

    public void send(
            String type,
            String message) {

        switch (type) {

            case "EMAIL":
                System.out.println("Email");
                break;

            case "SMS":
                System.out.println("SMS");
                break;

            case "PUSH":
                System.out.println("Push");
                break;
        }
    }
}
```

Better:

```java
interface NotificationSender {

    void send(String message);
}
```

Email:

```java
class EmailSender
        implements NotificationSender {

    public void send(String message) {
        System.out.println(
            "Email: " + message
        );
    }
}
```

SMS:

```java
class SmsSender
        implements NotificationSender {

    public void send(String message) {
        System.out.println(
            "SMS: " + message
        );
    }
}
```

Service:

```java
class NotificationService {

    private NotificationSender sender;

    public NotificationService(
            NotificationSender sender) {

        this.sender = sender;
    }

    public void notifyUser(String message) {
        sender.send(message);
    }
}
```

New requirement:

> Add WhatsApp.

Just add:

```java
class WhatsAppSender
        implements NotificationSender {

    public void send(String message) {
        System.out.println(
            "WhatsApp: " + message
        );
    }
}
```

Existing notification service remains unchanged.

---

# Where does object creation happen?

You may now notice a problem.

Somebody still has to write:

```java
NotificationSender sender =
        new EmailSender();
```

or:

```java
NotificationSender sender =
        new SmsSender();
```

So how do we decide which implementation gets created?

Excellent question.

That's where concepts like:

```text
Factory
Dependency Injection
Dependency Injection Containers
Spring
```

begin to enter the picture.

We'll get there.

---

# Important distinction: business rules vs configuration

Sometimes you genuinely need runtime decision logic.

For example:

```java
if (userPrefersSms) {
    ...
}
```

That doesn't automatically violate OCP.

The real goal is to keep the **implementation details** outside the decision logic where possible.

For example:

```java
NotificationSender sender =
        senderFactory.getSender(user.preference());
```

Then:

```java
sender.send(message);
```

The client doesn't need to know how each notification mechanism works.

---

# OCP and inheritance

You may hear:

> OCP means use inheritance.

Not necessarily.

Inheritance can support OCP:

```java
abstract class Payment {
    abstract void pay();
}
```

but interfaces and composition are often cleaner:

```java
interface PaymentMethod {
    void pay();
}
```

The important point is not inheritance.

The important point is:

> New behavior can be introduced without repeatedly rewriting stable logic.

---

# Real-world example — File exporters

Imagine:

```java
class ReportExporter {

    void export(String format) {

        if (format.equals("PDF")) {
            // PDF logic

        } else if (format.equals("CSV")) {
            // CSV logic

        } else if (format.equals("JSON")) {
            // JSON logic
        }
    }
}
```

Tomorrow:

```text
XML
Excel
HTML
Markdown
```

Again, the same problem.

Create:

```java
interface ReportExporter {

    void export(Report report);
}
```

Implementations:

```text
PdfExporter
CsvExporter
JsonExporter
ExcelExporter
```

Now the export format varies independently.

---

# OCP and stable boundaries

Here's a deeper way to understand the principle.

Suppose this interface is stable:

```java
interface PaymentMethod {
    void pay(double amount);
}
```

Behind it, implementations can change endlessly:

```text
CardPayment
PayPalPayment
BitcoinPayment
ApplePayPayment
BankTransferPayment
FuturePaymentMethod
```

The interface creates a **stable boundary**.

The calling code only depends on that boundary.

This is one of the major ideas behind scalable software architecture.

Stable abstractions protect one part of the system from changes happening elsewhere.

---

# But don't predict every future change

OCP can also be abused.

Imagine you have:

```java
class TaxCalculator {

    double calculate(double income) {
        return income * 0.20;
    }
}
```

You might say:

> "Maybe one day we'll support 900 tax systems."

So you immediately build:

```text
TaxStrategy
TaxFactory
TaxProvider
TaxRegistry
TaxContext
TaxResolver
TaxConfigurationManager
TaxStrategyFactoryProvider
```

That's not good design either.

You just designed for imaginary requirements.

A better philosophy is:

> **Abstract around changes that are real or reasonably expected.**

Don't build extension points everywhere.

---

# Another useful principle: YAGNI

You'll often hear:

> **YAGNI — You Aren't Gonna Need It**

It means:

> Don't add complexity for hypothetical future requirements unless there's a good reason.

So good design balances:

```text
OCP
    → support likely extension

YAGNI
    → don't overengineer imaginary extension
```

Excellent engineers balance both.

---

# SRP + OCP together

Now let's connect the first two SOLID principles.

Suppose:

```java
class OrderService {

    void checkout(Order order) {

        // validate order
        // process card/payment/paypal/etc.
        // save database
        // email
        // generate invoice
    }
}
```

SRP tells us:

> Separate unrelated responsibilities.

So we create:

```text
OrderService
PaymentService
OrderRepository
NotificationService
InvoiceService
```

Then OCP tells us:

> Design the varying parts so new implementations can be added cleanly.

So:

```text
PaymentMethod
 ├── CardPayment
 ├── PayPalPayment
 └── UpiPayment
```

And:

```text
NotificationSender
 ├── EmailSender
 ├── SmsSender
 └── PushSender
```

See what's happening?

SOLID principles work together.

---

# A small design exercise

Suppose we have:

```java
class ShippingService {

    public double calculateShipping(
            String shippingType,
            double weight) {

        if (shippingType.equals("STANDARD")) {
            return weight * 1.0;

        } else if (
            shippingType.equals("EXPRESS")) {

            return weight * 2.0;

        } else if (
            shippingType.equals("OVERNIGHT")) {

            return weight * 3.5;
        }

        return 0;
    }
}
```

Before reading further, think:

> What is varying?

Answer:

```text
Shipping calculation algorithm
```

So we could create:

```java
interface ShippingStrategy {

    double calculate(double weight);
}
```

Standard:

```java
class StandardShipping
        implements ShippingStrategy {

    public double calculate(double weight) {
        return weight * 1.0;
    }
}
```

Express:

```java
class ExpressShipping
        implements ShippingStrategy {

    public double calculate(double weight) {
        return weight * 2.0;
    }
}
```

Then:

```java
class ShippingService {

    private ShippingStrategy strategy;

    public ShippingService(
            ShippingStrategy strategy) {

        this.strategy = strategy;
    }

    public double calculate(double weight) {
        return strategy.calculate(weight);
    }
}
```

New international shipping?

```java
class InternationalShipping
        implements ShippingStrategy {

    public double calculate(double weight) {
        return weight * 5.0;
    }
}
```

No modification to `ShippingService`.

That's OCP.

---

# Interview answer

If an interviewer asks:

> What is Open/Closed Principle?

A strong answer is:

> The Open/Closed Principle says that software components should be open for extension but closed for modification. In practice, expected variations should often be placed behind abstractions so new behavior can be added through new implementations instead of repeatedly modifying existing stable code.

Then give the classic example:

> Instead of adding another `if/else` whenever a new payment type is introduced, define a `PaymentMethod` interface and add new implementations such as `CardPayment`, `PayPalPayment`, and `ApplePayPayment`.

That's a solid interview answer.

---

# Mental checklist

When you're designing something, ask:

```text
1. What behavior is likely to vary?

2. Am I modifying the same class every time
   a new variant appears?

3. Is there a growing switch or if/else chain?

4. Can the varying behavior live behind
   a common abstraction?

5. Can new behavior be added by implementing
   that abstraction?
```

If yes, you're probably dealing with an OCP situation.

---

# What we know so far

```text
SOLID

S — Single Responsibility Principle
    One cohesive responsibility.
    One primary reason to change.

O — Open/Closed Principle
    Extend behavior without repeatedly
    modifying stable code.

L — Coming next
I — Coming later
D — Coming later
```

And we've already started connecting the concepts:

```text
SRP
 ↓
separate responsibilities

OCP
 ↓
protect stable code from variations

Polymorphism
 ↓
different implementations,
same abstraction

Composition
 ↓
assemble behavior dynamically

Strategy Pattern
 ↓
encapsulate interchangeable behavior
```

These concepts will eventually start feeling like one connected design philosophy rather than separate rules.

# Lesson 4 — Liskov Substitution Principle

Next comes the most confusing SOLID principle for many developers:

> **Liskov Substitution Principle — LSP**

It answers a subtle but extremely important question:

> If `Dog` extends `Animal`, does that automatically mean `Dog` is a valid substitute for `Animal`?

Surprisingly, **no**.

We'll use examples like `Bird`/`Penguin`, `Rectangle`/`Square`, payment systems, and real Java inheritance mistakes to understand why some inheritance relationships look correct but produce broken designs.
