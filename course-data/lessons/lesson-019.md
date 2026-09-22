# Lesson 19 — Strategy Pattern

Now we begin the **Behavioral Design Patterns**.

Behavioral patterns focus on:

> How objects choose behavior, communicate, and divide responsibilities.

The **Strategy Pattern** is one of the most useful behavioral patterns in real applications.

Its core idea is:

> Encapsulate interchangeable algorithms behind a common interface so behavior can be selected or changed without modifying the client.

---

# 1. Start with the problem

Suppose we have a payment service:

```java
class PaymentService {

    public void pay(
            String type,
            double amount) {

        if (type.equals("CARD")) {

            System.out.println(
                "Paying by card"
            );

        } else if (
            type.equals("PAYPAL")) {

            System.out.println(
                "Paying by PayPal"
            );

        } else if (
            type.equals("CRYPTO")) {

            System.out.println(
                "Paying by crypto"
            );
        }
    }
}
```

This works.

But payment methods keep growing:

```text
CARD
PAYPAL
CRYPTO
APPLE_PAY
BANK_TRANSFER
UPI
```

Every new payment method modifies:

```java
PaymentService
```

We already learned during OCP that this is a warning sign.

---

# 2. Ask the design question

What is changing?

Not the whole checkout process.

The varying part is:

> **How the payment is performed.**

That is an algorithm or behavior.

Strategy tells us:

> Pull that changing behavior out into separate interchangeable objects.

---

# 3. Create the Strategy interface

```java
interface PaymentStrategy {

    void pay(double amount);
}
```

This defines the behavior all payment strategies must provide.

---

# 4. Concrete strategies

Card:

```java
class CardPayment
        implements PaymentStrategy {

    @Override
    public void pay(double amount) {

        System.out.println(
            "Paid $" + amount
            + " using card"
        );
    }
}
```

PayPal:

```java
class PayPalPayment
        implements PaymentStrategy {

    @Override
    public void pay(double amount) {

        System.out.println(
            "Paid $" + amount
            + " using PayPal"
        );
    }
}
```

Crypto:

```java
class CryptoPayment
        implements PaymentStrategy {

    @Override
    public void pay(double amount) {

        System.out.println(
            "Paid $" + amount
            + " using crypto"
        );
    }
}
```

---

# 5. Create the Context

The object using the strategy is usually called the:

> **Context**

```java
class PaymentService {

    private PaymentStrategy strategy;

    public PaymentService(
            PaymentStrategy strategy) {

        this.strategy = strategy;
    }

    public void checkout(double amount) {

        strategy.pay(amount);
    }
}
```

Notice what disappeared:

```text
if CARD
else if PAYPAL
else if CRYPTO
```

`PaymentService` no longer cares how payment happens.

It delegates that responsibility.

---

# 6. Usage

```java
PaymentStrategy strategy =
        new CardPayment();

PaymentService service =
        new PaymentService(strategy);

service.checkout(100);
```

Output:

```text
Paid $100 using card
```

Change to PayPal:

```java
PaymentService service =
        new PaymentService(
            new PayPalPayment()
        );
```

The `PaymentService` code stays unchanged.

---

# 7. Structure

Conceptually:

```text
              PaymentStrategy
               /      |      \
              /       |       \
          Card     PayPal    Crypto
              \       |       /
               \      |      /
                PaymentService
```

More accurately:

```text
Context
PaymentService
      |
      | has-a
      v
PaymentStrategy
      ^
      |
 ---------------------
 |         |         |
Card    PayPal    Crypto
```

The Context delegates the varying behavior to the Strategy.

---

# 8. Strategy roles

There are three key participants.

**Strategy**

```java
interface PaymentStrategy
```

defines the interchangeable behavior.

**Concrete Strategies**

```text
CardPayment
PayPalPayment
CryptoPayment
```

implement different versions of that behavior.

**Context**

```java
PaymentService
```

uses a Strategy without knowing its concrete implementation.

---

# 9. Strategy is really about variation

A common beginner mistake is thinking:

> Strategy means "put classes behind an interface."

That's too shallow.

The real design question is:

> Do I have multiple interchangeable ways of performing the same responsibility?

Examples:

```text
payment algorithms
discount algorithms
sorting algorithms
routing algorithms
compression algorithms
authentication methods
pricing rules
shipping calculations
retry policies
```

Those are strong Strategy candidates.

---

# 10. Discount example

Suppose:

```java
class DiscountCalculator {

    public double calculate(
            String type,
            double price) {

        if (type.equals("REGULAR")) {
            return price * 0.95;

        } else if (
            type.equals("PREMIUM")) {

            return price * 0.90;

        } else if (
            type.equals("VIP")) {

            return price * 0.80;
        }

        return price;
    }
}
```

The changing behavior is:

```text
discount calculation
```

So:

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

VIP:

```java
class VipDiscount
        implements DiscountStrategy {

    public double apply(double price) {
        return price * 0.80;
    }
}
```

Context:

```java
class DiscountCalculator {

    private final DiscountStrategy strategy;

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
DiscountCalculator calculator =
        new DiscountCalculator(
            new VipDiscount()
        );

double finalPrice =
        calculator.calculate(1000);
```

Result:

```text
800
```

---

# 11. Strategy supports runtime switching

Strategies don't always have to be fixed in the constructor.

Suppose:

```java
class NavigationService {

    private RouteStrategy strategy;

    public NavigationService(
            RouteStrategy strategy) {

        this.strategy = strategy;
    }

    public void setStrategy(
            RouteStrategy strategy) {

        this.strategy = strategy;
    }

    public Route calculate(
            Location from,
            Location to) {

        return strategy.calculate(
            from,
            to
        );
    }
}
```

Then:

```java
navigation.setStrategy(
    new FastestRouteStrategy()
);
```

Later:

```java
navigation.setStrategy(
    new ScenicRouteStrategy()
);
```

The same Context changes behavior at runtime.

That's one of Strategy's biggest strengths.

---

# 12. Navigation example

Define:

```java
interface RouteStrategy {

    Route calculate(
        Location from,
        Location to
    );
}
```

Fastest:

```java
class FastestRouteStrategy
        implements RouteStrategy {

    public Route calculate(
            Location from,
            Location to) {

        System.out.println(
            "Calculating fastest route"
        );

        return new Route();
    }
}
```

Walking:

```java
class WalkingRouteStrategy
        implements RouteStrategy {

    public Route calculate(
            Location from,
            Location to) {

        System.out.println(
            "Calculating walking route"
        );

        return new Route();
    }
}
```

Scenic:

```java
class ScenicRouteStrategy
        implements RouteStrategy {

    public Route calculate(
            Location from,
            Location to) {

        System.out.println(
            "Calculating scenic route"
        );

        return new Route();
    }
}
```

Same operation:

```java
calculate(from, to)
```

different algorithms.

That's Strategy.

---

# 13. Strategy and OCP

Suppose we already have:

```text
CardPayment
PayPalPayment
CryptoPayment
```

Then we add:

```java
class ApplePayPayment
        implements PaymentStrategy {

    public void pay(double amount) {
        ...
    }
}
```

What changes inside:

```java
PaymentService
```

?

Nothing.

That's Open/Closed Principle.

---

# 14. Strategy and DIP

`PaymentService` depends on:

```java
PaymentStrategy
```

not:

```java
CardPayment
```

So high-level workflow depends on an abstraction.

That's Dependency Inversion.

---

# 15. Strategy and SRP

Without Strategy:

```java
class PaymentService {

    void pay() {
        // card algorithm
        // PayPal algorithm
        // crypto algorithm
    }
}
```

The service owns several different payment algorithms.

With Strategy:

```text
PaymentService
→ coordinates checkout

CardPayment
→ card algorithm

PayPalPayment
→ PayPal algorithm

CryptoPayment
→ crypto algorithm
```

Responsibilities are cleaner.

---

# 16. Strategy and LSP

Every `PaymentStrategy` should honor:

```java
void pay(double amount);
```

If one implementation says:

```java
throw new UnsupportedOperationException();
```

for normal valid payments, the abstraction becomes unreliable.

So Strategy depends heavily on LSP.

---

# 17. How is Strategy selected?

This is important.

Strategy solves:

> How should the behavior itself be organized?

But something still needs to select the strategy.

For example:

```java
PaymentStrategy strategy;

switch (paymentType) {

    case CARD ->
        strategy = new CardPayment();

    case PAYPAL ->
        strategy = new PayPalPayment();

    default ->
        throw new IllegalArgumentException();
}
```

You might think:

> We still have a switch!

That's okay.

The goal is not to eliminate every conditional.

The goal is to avoid scattering implementation-specific conditionals throughout business logic.

Selection might happen once in:

```text
configuration
factory
composition root
controller boundary
dependency injection container
```

Then the Strategy handles behavior.

---

# 18. Strategy + Factory

These patterns frequently work together.

Factory:

```java
class PaymentStrategyFactory {

    public PaymentStrategy create(
            PaymentType type) {

        return switch (type) {

            case CARD ->
                new CardPayment();

            case PAYPAL ->
                new PayPalPayment();

            case CRYPTO ->
                new CryptoPayment();
        };
    }
}
```

Then:

```java
PaymentStrategy strategy =
        factory.create(type);

PaymentService service =
        new PaymentService(strategy);

service.checkout(amount);
```

Factory decides:

> Which strategy object should exist?

Strategy decides:

> How should the behavior work?

Different responsibilities.

---

# 19. Shipping example

Suppose:

```java
interface ShippingStrategy {

    double calculate(
        Package pkg
    );
}
```

Standard:

```java
class StandardShipping
        implements ShippingStrategy {

    @Override
    public double calculate(
            Package pkg) {

        return pkg.getWeight()
                * 1.0;
    }
}
```

Express:

```java
class ExpressShipping
        implements ShippingStrategy {

    @Override
    public double calculate(
            Package pkg) {

        return pkg.getWeight()
                * 2.5;
    }
}
```

Overnight:

```java
class OvernightShipping
        implements ShippingStrategy {

    @Override
    public double calculate(
            Package pkg) {

        return pkg.getWeight()
                * 5.0;
    }
}
```

Context:

```java
class ShippingCalculator {

    private final ShippingStrategy strategy;

    public ShippingCalculator(
            ShippingStrategy strategy) {

        this.strategy = strategy;
    }

    public double calculate(
            Package pkg) {

        return strategy.calculate(pkg);
    }
}
```

Again:

> same responsibility, interchangeable algorithm.

---

# 20. Sorting example

Strategy applies beautifully to sorting.

Imagine:

```java
interface SortStrategy {

    void sort(int[] values);
}
```

Bubble sort:

```java
class BubbleSortStrategy
        implements SortStrategy {

    public void sort(int[] values) {

        System.out.println(
            "Bubble sort"
        );
    }
}
```

Quick sort:

```java
class QuickSortStrategy
        implements SortStrategy {

    public void sort(int[] values) {

        System.out.println(
            "Quick sort"
        );
    }
}
```

Context:

```java
class DataProcessor {

    private SortStrategy strategy;

    public DataProcessor(
            SortStrategy strategy) {

        this.strategy = strategy;
    }

    public void process(int[] data) {

        strategy.sort(data);
    }
}
```

For small arrays:

```java
new DataProcessor(
    new BubbleSortStrategy()
);
```

For large arrays:

```java
new DataProcessor(
    new QuickSortStrategy()
);
```

Classic Strategy thinking.

---

# 21. Strategies can contain state

A strategy doesn't have to be stateless.

For example:

```java
class PercentageDiscount
        implements DiscountStrategy {

    private final double percentage;

    public PercentageDiscount(
            double percentage) {

        this.percentage = percentage;
    }

    @Override
    public double apply(double price) {

        return price
                * (1 - percentage);
    }
}
```

Usage:

```java
DiscountStrategy strategy =
        new PercentageDiscount(
            0.15
        );
```

So Strategies can be configured objects.

---

# 22. Strategy with lambdas

Now we get to something very useful in Java.

Suppose our interface has exactly one abstract method:

```java
interface DiscountStrategy {

    double apply(double price);
}
```

This is a functional interface.

We can write:

```java
DiscountStrategy vipDiscount =
        price -> price * 0.80;
```

Instead of:

```java
class VipDiscount
        implements DiscountStrategy {
    ...
}
```

Then:

```java
DiscountCalculator calculator =
        new DiscountCalculator(
            price -> price * 0.80
        );
```

This is still Strategy in spirit.

The strategy is simply represented as a function rather than a named class.

---

# 23. Add `@FunctionalInterface`

We can make the intention explicit:

```java
@FunctionalInterface
interface DiscountStrategy {

    double apply(double price);
}
```

Then:

```java
DiscountStrategy noDiscount =
        price -> price;

DiscountStrategy tenPercent =
        price -> price * 0.90;

DiscountStrategy halfPrice =
        price -> price * 0.50;
```

This makes Strategy very lightweight.

---

# 24. Using standard Java functional interfaces

Sometimes you don't even need your own interface.

For:

```java
double -> double
```

you might use:

```java
DoubleUnaryOperator
```

Example:

```java
class DiscountCalculator {

    private final DoubleUnaryOperator discount;

    public DiscountCalculator(
            DoubleUnaryOperator discount) {

        this.discount = discount;
    }

    public double calculate(
            double price) {

        return discount
                .applyAsDouble(price);
    }
}
```

Usage:

```java
DiscountCalculator calculator =
        new DiscountCalculator(
            price -> price * 0.80
        );
```

Conceptually, that's still Strategy.

---

# 25. Named class vs lambda

Use a lambda when behavior is:

```text
small
simple
local
stateless
```

For example:

```java
price -> price * 0.90
```

Use a dedicated Strategy class when behavior is:

```text
complex
reusable
stateful
independently tested
needs dependencies
has meaningful domain terminology
```

For example:

```java
class HolidayPromotionStrategy
        implements PricingStrategy {

    private final PromotionRepository repository;
    private final Clock clock;

    ...
}
```

A class is much clearer there.

---

# 26. Strategy can receive dependencies

Suppose fraud checking differs by payment type.

```java
class CardPaymentStrategy
        implements PaymentStrategy {

    private final FraudService fraudService;
    private final CardGateway gateway;

    public CardPaymentStrategy(
            FraudService fraudService,
            CardGateway gateway) {

        this.fraudService = fraudService;
        this.gateway = gateway;
    }

    @Override
    public void pay(double amount) {

        fraudService.verify(amount);

        gateway.charge(amount);
    }
}
```

Strategies can participate in normal dependency injection just like any other service.

---

# 27. Strategy vs Template Method

We'll study Template Method later, but this distinction matters.

Template Method typically uses **inheritance**.

Example:

```java
abstract class DataProcessor {

    public final void process() {

        read();
        transform();
        save();
    }

    protected abstract void transform();
}
```

Subclass changes one step.

Strategy uses **composition**:

```java
class DataProcessor {

    private TransformStrategy strategy;
}
```

So:

```text
Template Method
→ inheritance-based variation

Strategy
→ composition-based variation
```

Strategy is usually more flexible at runtime.

---

# 28. Strategy vs State

This is one of the most important comparisons.

Structurally, Strategy and State can look almost identical.

Strategy:

```java
class Context {

    private Strategy strategy;
}
```

State:

```java
class Context {

    private State state;
}
```

So what's the difference?

Again:

> **Intent.**

Strategy:

> Choose how an operation should be performed.

State:

> Behavior changes because the object is currently in a particular state.

Example Strategy:

```text
Shipping algorithm:
Standard
Express
Overnight
```

Example State:

```text
Order state:
Created
Paid
Shipped
Delivered
Cancelled
```

We'll study State deeply later.

---

# 29. Strategy usually selected externally

For Strategy:

```java
checkout.setPaymentStrategy(
    new CardPayment()
);
```

Often the client/configuration chooses the algorithm.

For State, the context often changes state internally:

```text
Created
  ↓ pay()
Paid
  ↓ ship()
Shipped
```

The object transitions because events occur.

A useful rule:

```text
Strategy
→ client chooses behavior

State
→ current lifecycle state drives behavior
```

Not universally true, but very useful.

---

# 30. Strategy vs Bridge

Bridge also uses composition.

Strategy:

```text
Context
   ↓
Strategy
```

Bridge:

```text
Abstraction hierarchy
   ↓
Implementation hierarchy
```

Strategy solves:

> Interchangeable behavior/algorithm.

Bridge solves:

> Two independent variation dimensions.

Example Strategy:

```text
PaymentService
→ Card algorithm / PayPal algorithm
```

Example Bridge:

```text
Notification type
→ Email/SMS delivery implementation
```

Again, intent.

---

# 31. Strategy vs Decorator

Decorator layers several behaviors:

```text
Logging
  ↓
Retry
  ↓
Payment
```

Strategy typically selects one interchangeable behavior:

```text
Payment Strategy
├── Card
├── PayPal
└── Crypto
```

So:

```text
Strategy
→ choose

Decorator
→ stack
```

---

# 32. Strategy vs Command

We'll study Command later.

Strategy represents:

> How to perform some behavior.

Command represents:

> A request/action packaged as an object.

Strategy example:

```java
discount.apply(price);
```

Command example:

```java
command.execute();
```

Commands often support:

```text
queues
undo
history
scheduling
logging actions
```

Strategy focuses on algorithm substitution.

---

# 33. Strategy can remove duplicate conditionals

Suppose several methods contain:

```java
if (type == CARD) {
    ...
} else if (type == PAYPAL) {
    ...
}
```

and similar logic appears repeatedly.

For example:

```text
validate payment
execute payment
calculate fee
generate label
```

You might have:

```java
if (type == CARD) {
    validateCard();
}
```

somewhere else:

```java
if (type == CARD) {
    chargeCard();
}
```

and somewhere else:

```java
if (type == CARD) {
    calculateCardFee();
}
```

Now type-specific behavior is scattered.

A Strategy can collect those related behaviors:

```java
interface PaymentStrategy {

    void validate();

    void pay(double amount);

    double calculateFee(double amount);
}
```

Then each strategy owns its complete variant behavior.

This can dramatically reduce scattered conditionals.

---

# 34. But be careful with interface size

Suppose only some payment strategies support:

```java
refund();
```

If you add:

```java
interface PaymentStrategy {

    void pay();

    void refund();

    void schedule();

    void generateInvoice();
}
```

we might recreate an ISP/LSP problem.

So Strategy interfaces should remain cohesive.

SOLID still matters.

---

# 35. Strategy maps instead of switch statements

Sometimes runtime selection can be handled with a map.

For example:

```java
Map<PaymentType, PaymentStrategy>
        strategies;
```

Then:

```java
PaymentStrategy strategy =
        strategies.get(type);

strategy.pay(amount);
```

Spring-style example:

```java
class PaymentStrategyRegistry {

    private final Map<PaymentType, PaymentStrategy>
            strategies;

    public PaymentStrategyRegistry(
            Map<PaymentType, PaymentStrategy>
                    strategies) {

        this.strategies = strategies;
    }

    public PaymentStrategy get(
            PaymentType type) {

        PaymentStrategy strategy =
                strategies.get(type);

        if (strategy == null) {
            throw new IllegalArgumentException(
                "Unsupported payment type"
            );
        }

        return strategy;
    }
}
```

This can be cleaner than a growing switch.

---

# 36. Strategies identifying themselves

One practical approach:

```java
interface PaymentStrategy {

    PaymentType supports();

    void pay(double amount);
}
```

Card:

```java
class CardPayment
        implements PaymentStrategy {

    @Override
    public PaymentType supports() {
        return PaymentType.CARD;
    }

    @Override
    public void pay(double amount) {
        ...
    }
}
```

Then registry construction:

```java
for (PaymentStrategy strategy
        : allStrategies) {

    map.put(
        strategy.supports(),
        strategy
    );
}
```

This is common in DI-based applications.

---

# 37. Strategy and dependency injection

With a DI container, you may inject all strategies:

```java
class PaymentService {

    private final Map<PaymentType, PaymentStrategy>
            strategies;

    ...
}
```

Then the application can select at runtime based on:

```text
customer choice
configuration
request data
feature flags
environment
```

without business code instantiating concrete strategy classes.

Strategy + DI is a powerful combination.

---

# 38. Retry strategy example

Suppose different operations need different retry policies.

```java
interface RetryStrategy {

    boolean shouldRetry(
        int attempt,
        Exception error
    );

    long delayMillis(
        int attempt
    );
}
```

Immediate retry:

```java
class ImmediateRetry
        implements RetryStrategy {

    public boolean shouldRetry(
            int attempt,
            Exception error) {

        return attempt < 3;
    }

    public long delayMillis(
            int attempt) {

        return 0;
    }
}
```

Exponential backoff:

```java
class ExponentialBackoff
        implements RetryStrategy {

    public boolean shouldRetry(
            int attempt,
            Exception error) {

        return attempt < 5;
    }

    public long delayMillis(
            int attempt) {

        return (long)
                Math.pow(2, attempt)
                * 100;
    }
}
```

The caller can select the appropriate policy without rewriting retry infrastructure.

Very practical Strategy use case.

---

# 39. Authentication strategy example

Suppose:

```java
interface AuthenticationStrategy {

    User authenticate(
        Credentials credentials
    );
}
```

Implementations:

```text
PasswordAuthentication
OAuthAuthentication
ApiKeyAuthentication
CertificateAuthentication
```

Login service:

```java
class AuthenticationService {

    private final AuthenticationStrategy strategy;

    public AuthenticationService(
            AuthenticationStrategy strategy) {

        this.strategy = strategy;
    }

    public User login(
            Credentials credentials) {

        return strategy.authenticate(
            credentials
        );
    }
}
```

Same goal:

> Interchangeable authentication mechanisms.

---

# 40. Pricing strategy example

Imagine ride-sharing pricing:

```java
interface PricingStrategy {

    Money calculate(
        Ride ride
    );
}
```

Possible strategies:

```text
NormalPricing
SurgePricing
WeekendPricing
PromotionalPricing
```

The main ride service shouldn't contain:

```java
if (surge) ...
else if (weekend) ...
else if (promotion) ...
```

when these algorithms are complex and evolving.

Put them behind Strategy.

---

# 41. But what if multiple pricing rules apply together?

Excellent distinction.

Suppose:

```text
base fare
+
surge multiplier
+
coupon
+
loyalty discount
+
tax
```

These aren't necessarily mutually exclusive strategies.

You may need composition, pipelines, Decorator, or Chain of Responsibility instead.

Strategy is strongest when algorithms are alternative implementations of the same responsibility.

Think:

```text
choose A OR B OR C
```

rather than:

```text
apply A AND B AND C
```

That's a useful recognition rule.

---

# 42. Overengineering warning

Suppose:

```java
class Calculator {

    int add(
            int a,
            int b) {

        return a + b;
    }
}
```

You probably don't need:

```text
AdditionStrategy
SubtractionStrategy
CalculatorContext
OperationStrategyFactory
```

unless operations genuinely need runtime substitution or extension.

Strategy adds:

```text
interfaces
classes
indirection
configuration
```

Use it when variability justifies that complexity.

---

# 43. Another case where Strategy may be unnecessary

Suppose:

```java
if (isAdmin) {
    showAdminPage();
} else {
    showUserPage();
}
```

That's a simple business decision.

Creating:

```text
AdminPageStrategy
UserPageStrategy
```

may make the design worse.

Don't eliminate conditionals mechanically.

Ask:

> Is this behavior substantial, independently evolving, and interchangeable?

If no, keep it simple.

---

# 44. Strategy can improve testing

Suppose:

```java
class CheckoutService {

    private final FraudStrategy fraudStrategy;
}
```

For production:

```java
new RealFraudStrategy(...)
```

For tests:

```java
class AlwaysApproveFraudStrategy
        implements FraudStrategy {

    public boolean approve(
            Transaction transaction) {

        return true;
    }
}
```

Then tests can isolate checkout logic.

Another Strategy advantage:

> Behavior becomes replaceable during tests.

---

# 45. Strategy names should express behavior

Avoid vague names like:

```text
StrategyA
StrategyB
StrategyImpl1
```

Prefer:

```text
FastestRouteStrategy
WalkingRouteStrategy
ExpressShippingStrategy
PercentageDiscountStrategy
ExponentialBackoffStrategy
```

Patterns improve communication when names express real domain concepts.

---

# 46. Strategy and polymorphism

At runtime:

```java
PaymentStrategy strategy;
```

may reference:

```text
CardPayment
PayPalPayment
CryptoPayment
```

And:

```java
strategy.pay(amount);
```

dispatches to the appropriate implementation.

So Strategy is built on polymorphism.

A compact relationship:

```text
Strategy
=
encapsulation
+
composition
+
polymorphism
```

---

# 47. Strategy mental model

Remember:

```text
Context
   |
   | delegates
   v
Strategy
   ^
   |
 -------------------
 |        |        |
 A        B        C
```

The Context says:

> I know **when** this behavior is needed.

The Strategy says:

> I know **how** this behavior should be performed.

That's a very useful way to understand the separation.

---

# 48. Recognition clues

Think Strategy when requirements say:

```text
"We have several ways of doing the same thing."

"The algorithm should be selectable at runtime."

"There's a growing if/else based on behavior type."

"Different customers use different pricing rules."

"Different requests use different routing algorithms."

"We want to replace an algorithm without
changing the client."
```

The strongest question is:

> **Do I have several interchangeable ways of performing one responsibility?**

If yes, Strategy is a strong candidate.

---

# 49. Interview answer

If asked:

> What is the Strategy Pattern?

A strong answer is:

> Strategy is a behavioral design pattern that encapsulates interchangeable algorithms behind a common interface and allows a context to delegate behavior to the selected strategy. This lets the algorithm vary independently from the client using it and often replaces large conditional branches with polymorphism.

Example:

> A `PaymentService` can depend on a `PaymentStrategy`, with implementations such as `CardPayment`, `PayPalPayment`, and `CryptoPayment`.

---

# 50. Strategy vs the patterns we've already learned

A useful comparison:

| Pattern | Core question |
|---|---|
| Factory Method | Which concrete object should I create? |
| Bridge | How can two dimensions vary independently? |
| Decorator | How can I layer additional behavior? |
| Proxy | How can I control access? |
| Strategy | Which interchangeable algorithm should I use? |

This is why intent matters more than class diagrams.

---

# Behavioral patterns roadmap

We've now started the behavioral group:

```text
Strategy
Observer
Command
State
Template Method
Chain of Responsibility
Iterator
Mediator
Memento
Visitor
Interpreter
```

A useful preview:

```text
Strategy
→ interchangeable algorithms

Observer
→ notify interested objects when something changes

Command
→ represent an action as an object

State
→ behavior changes with internal state

Template Method
→ define algorithm skeleton, customize steps

Chain of Responsibility
→ pass request through handlers

Iterator
→ traverse collections cleanly

Mediator
→ centralize communication between objects

Memento
→ capture and restore state

Visitor
→ add operations to object structures

Interpreter
→ represent and evaluate a small language
```

# Next: Lesson 20 — Observer Pattern

Observer solves one of the most common event-driven problems:

> One object changes, and many other objects need to know.

Imagine a stock price:

```text
Stock
  ↓ price changes
```

and these consumers:

```text
MobileApp
EmailAlert
TradingDashboard
AnalyticsSystem
```

You don't want `Stock` tightly coupled to every concrete consumer.

Observer gives us:

```text
Publisher
   |
   +--> Observer A
   +--> Observer B
   +--> Observer C
```

Then:

```java
stock.setPrice(150);
```

can automatically notify all subscribed observers.

**Lesson 20 — Observer Pattern** will cover publishers/subscribers, push vs pull models, event listeners, Java callbacks, memory-leak risks, observer removal, ordering, synchronous vs asynchronous notifications, and how Observer relates to event buses and message brokers.
