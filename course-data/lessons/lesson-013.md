# Lesson 13 — Decorator Pattern

The **Decorator Pattern** is used when you want to add behavior to an object **dynamically**, without changing the original class and without creating a huge inheritance hierarchy.

The central idea is:

> Wrap an object with another object that implements the same interface.

Because the wrapper has the same interface as the wrapped object, decorators can be stacked on top of one another.

This pattern is one of the clearest examples of:

> **Favor composition over inheritance.**

---

## 1. The problem

Imagine we're building a coffee shop system.

We start with:

```java
interface Beverage {

    String getDescription();

    double getCost();
}
```

A basic coffee:

```java
class Coffee implements Beverage {

    @Override
    public String getDescription() {
        return "Coffee";
    }

    @Override
    public double getCost() {
        return 3.00;
    }
}
```

Usage:

```java
Beverage coffee = new Coffee();

System.out.println(
    coffee.getDescription()
);

System.out.println(
    coffee.getCost()
);
```

Output:

```text
Coffee
3.0
```

Simple enough.

Then customers ask for extras.

```text
Milk
Sugar
Whipped cream
Caramel
Vanilla
Chocolate
```

One obvious approach is inheritance.

---

# 2. Inheritance approach

We might create:

```java
class MilkCoffee extends Coffee {

    @Override
    public double getCost() {
        return super.getCost() + 0.50;
    }
}
```

Then:

```java
class SugarCoffee extends Coffee {

    @Override
    public double getCost() {
        return super.getCost() + 0.25;
    }
}
```

So far, still manageable.

But what about:

```text
Coffee + Milk + Sugar
```

We create:

```java
class MilkSugarCoffee extends Coffee {
}
```

Then:

```text
Coffee + Milk + Whipped Cream
Coffee + Sugar + Caramel
Coffee + Milk + Sugar + Caramel
Coffee + Vanilla + Whipped Cream
```

Soon the hierarchy becomes:

```text
Coffee
├── MilkCoffee
├── SugarCoffee
├── CaramelCoffee
├── MilkSugarCoffee
├── MilkCaramelCoffee
├── SugarCaramelCoffee
├── MilkSugarCaramelCoffee
└── ...
```

This is called a **combinatorial explosion**.

Every combination may require another subclass.

That's not scalable.

---

# 3. Another bad solution: giant flags

Maybe we avoid inheritance and write:

```java
class Coffee {

    private boolean milk;
    private boolean sugar;
    private boolean caramel;
    private boolean whippedCream;

    public double getCost() {

        double cost = 3.00;

        if (milk) {
            cost += 0.50;
        }

        if (sugar) {
            cost += 0.25;
        }

        if (caramel) {
            cost += 0.75;
        }

        if (whippedCream) {
            cost += 1.00;
        }

        return cost;
    }
}
```

This avoids subclasses.

But now `Coffee` knows about every possible add-on.

Every time we add something:

```text
Cinnamon
Honey
Soy Milk
Oat Milk
Protein
```

we modify `Coffee`.

That hurts OCP.

The base class becomes responsible for behavior it shouldn't own.

---

# 4. Decorator approach

Let's go back to:

```java
interface Beverage {

    String getDescription();

    double getCost();
}
```

Our basic object stays:

```java
class Coffee implements Beverage {

    @Override
    public String getDescription() {
        return "Coffee";
    }

    @Override
    public double getCost() {
        return 3.00;
    }
}
```

Now we'll create another object that also implements `Beverage`.

But this object contains another `Beverage`.

```java
abstract class BeverageDecorator
        implements Beverage {

    protected final Beverage beverage;

    public BeverageDecorator(
            Beverage beverage) {

        this.beverage = beverage;
    }
}
```

This is the key structure.

A decorator:

```text
IS-A Beverage
HAS-A Beverage
```

That combination is what makes the pattern work.

---

# 5. Milk decorator

```java
class MilkDecorator
        extends BeverageDecorator {

    public MilkDecorator(
            Beverage beverage) {

        super(beverage);
    }

    @Override
    public String getDescription() {

        return beverage.getDescription()
                + ", Milk";
    }

    @Override
    public double getCost() {

        return beverage.getCost()
                + 0.50;
    }
}
```

Notice what it does.

It first delegates:

```java
beverage.getCost()
```

then adds its own behavior:

```java
+ 0.50
```

That's decorating.

---

# 6. Sugar decorator

```java
class SugarDecorator
        extends BeverageDecorator {

    public SugarDecorator(
            Beverage beverage) {

        super(beverage);
    }

    @Override
    public String getDescription() {

        return beverage.getDescription()
                + ", Sugar";
    }

    @Override
    public double getCost() {

        return beverage.getCost()
                + 0.25;
    }
}
```

Now watch what happens.

---

# 7. Wrapping objects

Start:

```java
Beverage beverage =
        new Coffee();
```

Structure:

```text
Coffee
```

Now add milk:

```java
beverage =
        new MilkDecorator(
            beverage
        );
```

Structure:

```text
MilkDecorator
      |
      v
   Coffee
```

Now add sugar:

```java
beverage =
        new SugarDecorator(
            beverage
        );
```

Structure becomes:

```text
SugarDecorator
      |
      v
MilkDecorator
      |
      v
   Coffee
```

Now:

```java
System.out.println(
    beverage.getDescription()
);

System.out.println(
    beverage.getCost()
);
```

Let's follow the call.

---

# 8. How delegation works

We call:

```java
beverage.getCost();
```

The outer object is:

```text
SugarDecorator
```

So:

```java
SugarDecorator.getCost()
```

does:

```java
beverage.getCost() + 0.25
```

Its `beverage` is `MilkDecorator`.

So:

```java
MilkDecorator.getCost()
```

does:

```java
beverage.getCost() + 0.50
```

Its `beverage` is `Coffee`.

Then:

```java
Coffee.getCost()
```

returns:

```text
3.00
```

Now calls return outward:

```text
Coffee
3.00
```

then:

```text
Milk
3.00 + 0.50
= 3.50
```

then:

```text
Sugar
3.50 + 0.25
= 3.75
```

Final result:

```text
3.75
```

That's Decorator in action.

---

# 9. Add whipped cream

```java
class WhippedCreamDecorator
        extends BeverageDecorator {

    public WhippedCreamDecorator(
            Beverage beverage) {

        super(beverage);
    }

    @Override
    public String getDescription() {

        return beverage.getDescription()
                + ", Whipped Cream";
    }

    @Override
    public double getCost() {

        return beverage.getCost()
                + 1.00;
    }
}
```

Now:

```java
Beverage beverage =
        new Coffee();

beverage =
        new MilkDecorator(beverage);

beverage =
        new SugarDecorator(beverage);

beverage =
        new WhippedCreamDecorator(
            beverage
        );
```

Structure:

```text
WhippedCreamDecorator
          |
          v
    SugarDecorator
          |
          v
     MilkDecorator
          |
          v
        Coffee
```

All of them are still:

```java
Beverage
```

to the caller.

That's extremely important.

---

# 10. Why the same interface matters

Suppose `MilkDecorator` did not implement `Beverage`.

Then after wrapping:

```java
MilkDecorator milk =
        new MilkDecorator(coffee);
```

the caller would have to treat it as some special type.

We wouldn't be able to keep stacking decorators naturally.

But because:

```java
class MilkDecorator
        implements Beverage
```

a decorated object can be used anywhere the original object could be used.

So:

```text
Coffee
MilkDecorator
SugarDecorator
WhippedCreamDecorator
```

are all seen as:

```java
Beverage
```

This is what enables recursive wrapping.

---

# 11. General structure

The classic Decorator structure looks like:

```text
             Component
                 ^
                 |
        ------------------
        |                |
ConcreteComponent     Decorator
                         |
                         v
                     Component
                         ^
                         |
                ------------------
                |                |
         DecoratorA        DecoratorB
```

In our example:

```text
Component
    Beverage

ConcreteComponent
    Coffee

Decorator
    BeverageDecorator

ConcreteDecorators
    MilkDecorator
    SugarDecorator
    WhippedCreamDecorator
```

---

# 12. The most important design detail

A decorator usually has this shape:

```java
class SomeDecorator
        implements Component {

    private final Component component;

    public SomeDecorator(
            Component component) {

        this.component = component;
    }

    @Override
    public void operation() {

        component.operation();

        // extra behavior
    }
}
```

That's the pattern in its simplest form.

Notice:

```text
implements Component
```

and:

```text
contains Component
```

Again:

> **IS-A Component + HAS-A Component**

Remember that.

---

# 13. Real-world example: notifications

Suppose:

```java
interface NotificationSender {

    void send(String message);
}
```

Basic implementation:

```java
class EmailSender
        implements NotificationSender {

    @Override
    public void send(String message) {

        System.out.println(
            "Email: " + message
        );
    }
}
```

Now suppose we want optional logging.

We could modify `EmailSender`.

But logging may also be needed for SMS, push notifications, etc.

Instead:

```java
class LoggingNotificationDecorator
        implements NotificationSender {

    private final NotificationSender sender;

    public LoggingNotificationDecorator(
            NotificationSender sender) {

        this.sender = sender;
    }

    @Override
    public void send(String message) {

        System.out.println(
            "LOG: sending notification"
        );

        sender.send(message);

        System.out.println(
            "LOG: notification sent"
        );
    }
}
```

Usage:

```java
NotificationSender sender =
        new EmailSender();

sender =
        new LoggingNotificationDecorator(
            sender
        );

sender.send(
    "Order shipped"
);
```

Now logging was added without changing `EmailSender`.

---

# 14. Add retry behavior

```java
class RetryNotificationDecorator
        implements NotificationSender {

    private final NotificationSender sender;

    public RetryNotificationDecorator(
            NotificationSender sender) {

        this.sender = sender;
    }

    @Override
    public void send(String message) {

        int attempts = 0;

        while (attempts < 3) {

            try {

                sender.send(message);

                return;

            } catch (
                RuntimeException e
            ) {

                attempts++;
            }
        }

        throw new RuntimeException(
            "Notification failed"
        );
    }
}
```

Now:

```java
NotificationSender sender =
        new EmailSender();

sender =
        new RetryNotificationDecorator(
            sender
        );

sender =
        new LoggingNotificationDecorator(
            sender
        );
```

We have composed:

```text
Logging
   ↓
Retry
   ↓
Email
```

No inheritance explosion.

---

# 15. Order matters

This is an important Decorator detail.

Consider:

```text
Logging
  ↓
Retry
  ↓
Email
```

versus:

```text
Retry
  ↓
Logging
  ↓
Email
```

They may behave differently.

In the first version, logging may happen once around the entire retry operation.

In the second version, logging may happen on every retry attempt.

So decorators can be composable, but:

> **Decorator order can affect behavior.**

That's both powerful and something you must reason about carefully.

---

# 16. Another example: data source

Suppose:

```java
interface DataSource {

    void write(String data);

    String read();
}
```

Basic file implementation:

```java
class FileDataSource
        implements DataSource {

    @Override
    public void write(String data) {

        System.out.println(
            "Writing: " + data
        );
    }

    @Override
    public String read() {

        return "stored data";
    }
}
```

Now imagine optional behaviors:

```text
Compression
Encryption
Logging
Caching
```

Instead of creating:

```text
EncryptedFileDataSource
CompressedFileDataSource
EncryptedCompressedFileDataSource
LoggedEncryptedCompressedFileDataSource
```

we use decorators.

---

# 17. Encryption decorator

```java
class EncryptionDecorator
        implements DataSource {

    private final DataSource source;

    public EncryptionDecorator(
            DataSource source) {

        this.source = source;
    }

    @Override
    public void write(String data) {

        String encrypted =
                encrypt(data);

        source.write(encrypted);
    }

    @Override
    public String read() {

        String data =
                source.read();

        return decrypt(data);
    }

    private String encrypt(
            String data) {

        return "encrypted(" + data + ")";
    }

    private String decrypt(
            String data) {

        return "decrypted(" + data + ")";
    }
}
```

---

# 18. Compression decorator

```java
class CompressionDecorator
        implements DataSource {

    private final DataSource source;

    public CompressionDecorator(
            DataSource source) {

        this.source = source;
    }

    @Override
    public void write(String data) {

        String compressed =
                compress(data);

        source.write(compressed);
    }

    @Override
    public String read() {

        String data =
                source.read();

        return decompress(data);
    }

    private String compress(
            String data) {

        return "compressed(" + data + ")";
    }

    private String decompress(
            String data) {

        return "decompressed(" + data + ")";
    }
}
```

Usage:

```java
DataSource source =
        new FileDataSource();

source =
        new EncryptionDecorator(
            source
        );

source =
        new CompressionDecorator(
            source
        );

source.write("Hello");
```

The resulting chain:

```text
Compression
     ↓
Encryption
     ↓
File
```

Again, behavior is composed dynamically.

---

# 19. Decorator vs inheritance

Inheritance gives behavior at the class level.

For example:

```java
class LoggingPaymentService
        extends PaymentService {
}
```

Then perhaps:

```java
class RetryingLoggingPaymentService
        extends LoggingPaymentService {
}
```

Then:

```java
class CachedRetryingLoggingPaymentService
        extends RetryingLoggingPaymentService {
}
```

The combinations are built into the type hierarchy.

Decorator instead creates combinations at runtime:

```java
PaymentService payment =
        new BasicPaymentService();

payment =
        new LoggingDecorator(payment);

payment =
        new RetryDecorator(payment);
```

So composition gives us far more flexibility.

---

# 20. Static vs dynamic behavior

Inheritance is relatively static.

Once you instantiate:

```java
new LoggingPaymentService()
```

its behavior comes from its class hierarchy.

Decorator is dynamic.

You can decide at runtime:

```java
Service service =
        new BasicService();

if (loggingEnabled) {
    service =
        new LoggingDecorator(service);
}

if (retryEnabled) {
    service =
        new RetryDecorator(service);
}

if (metricsEnabled) {
    service =
        new MetricsDecorator(service);
}
```

That's a major benefit.

---

# 21. This strongly supports OCP

Suppose we have:

```text
Coffee
MilkDecorator
SugarDecorator
```

Then a new requirement appears:

> Add caramel.

We add:

```java
class CaramelDecorator
        extends BeverageDecorator {

    public CaramelDecorator(
            Beverage beverage) {

        super(beverage);
    }

    @Override
    public String getDescription() {

        return beverage.getDescription()
                + ", Caramel";
    }

    @Override
    public double getCost() {

        return beverage.getCost()
                + 0.75;
    }
}
```

What did we modify?

```text
Coffee?
No.

MilkDecorator?
No.

SugarDecorator?
No.
```

We extended the system with another decorator.

That's OCP.

---

# 22. Decorator and SRP

Without Decorator:

```java
class PaymentService {

    void pay() {
        // payment
        // logging
        // retry
        // metrics
        // caching
        // tracing
    }
}
```

That's many concerns mixed together.

With decorators:

```text
BasicPaymentService
→ payment

LoggingDecorator
→ logging

RetryDecorator
→ retry

MetricsDecorator
→ metrics
```

Each concern can remain focused.

That's SRP.

---

# 23. Decorator and LSP

A decorator implements the same interface:

```java
interface NotificationSender
```

So callers should be able to use either:

```java
new EmailSender()
```

or:

```java
new LoggingDecorator(
    new EmailSender()
)
```

without breaking the basic contract.

That's LSP thinking.

---

# 24. Decorator and DIP

High-level code can depend on:

```java
NotificationSender
```

without knowing whether it's receiving:

```text
EmailSender

or

LoggingDecorator
  ↓
RetryDecorator
  ↓
EmailSender
```

The entire decorated chain still conforms to the abstraction.

That's powerful.

---

# 25. Decorator vs Adapter

This comparison is extremely important.

Adapter:

> Changes the interface so incompatible objects can work together.

Decorator:

> Keeps the same interface and adds behavior.

Adapter example:

```text
LegacyPaymentGateway

makePaymentInCents()
        ↓
Adapter
        ↓
PaymentProcessor.pay()
```

Decorator:

```text
PaymentProcessor
        ↓
LoggingPaymentProcessor
        ↓
Original PaymentProcessor
```

Same interface.

Remember:

```text
Adapter
→ change interface

Decorator
→ add behavior
```

---

# 26. Decorator vs Proxy

These look very similar structurally.

Both may look like:

```java
class Wrapper
        implements Service {

    private Service service;
}
```

The difference is **intent**.

Decorator:

> Add responsibilities.

Proxy:

> Control access.

A decorator might add:

```text
compression
encryption
formatting
logging
```

A proxy might handle:

```text
authorization
lazy loading
remote communication
caching
access control
```

We'll study Proxy later.

---

# 27. Decorator vs Strategy

Strategy usually replaces one behavior.

For example:

```java
DiscountStrategy strategy;
```

and you choose:

```text
RegularDiscount
VipDiscount
HolidayDiscount
```

Usually one strategy is selected at a time.

Decorator instead layers behavior.

```text
Base Object
  ↓
Decorator A
  ↓
Decorator B
  ↓
Decorator C
```

Think:

```text
Strategy
→ choose behavior

Decorator
→ stack behavior
```

That's a useful distinction.

---

# 28. Decorator vs Chain of Responsibility

Another future pattern can look similar because it forms a chain.

Decorator chain:

```text
A
 ↓
B
 ↓
C
 ↓
Object
```

Every decorator normally participates in processing and forwards to the wrapped component.

Chain of Responsibility:

```text
Handler A
    ↓
Handler B
    ↓
Handler C
```

A handler may decide:

```text
"I'll handle this"
```

and stop the chain.

So the intentions differ.

We'll cover that later.

---

# 29. Java I/O is a classic Decorator example

Java's I/O APIs famously use decorator-style composition.

You may see:

```java
InputStream input =
        new FileInputStream(
            "data.txt"
        );
```

Then wrap it:

```java
input =
        new BufferedInputStream(
            input
        );
```

Conceptually:

```text
BufferedInputStream
        ↓
FileInputStream
```

Both are:

```java
InputStream
```

One adds buffering around another stream.

You may then add other wrappers.

This is one of the best-known real-world uses of Decorator in Java.

---

# 30. Another Java example: readers

You may write:

```java
Reader reader =
        new FileReader(
            "data.txt"
        );
```

Then:

```java
reader =
        new BufferedReader(
            reader
        );
```

The buffered wrapper adds behavior without changing the basic reading abstraction.

This kind of API is built around composition.

---

# 31. Decorator and HTTP clients

Imagine:

```java
interface HttpClient {

    Response send(Request request);
}
```

Basic client:

```java
class BasicHttpClient
        implements HttpClient {

    public Response send(
            Request request) {

        // actual HTTP request

        return new Response();
    }
}
```

Logging:

```java
class LoggingHttpClient
        implements HttpClient {

    private final HttpClient client;

    public LoggingHttpClient(
            HttpClient client) {

        this.client = client;
    }

    @Override
    public Response send(
            Request request) {

        System.out.println(
            "Sending request"
        );

        Response response =
                client.send(request);

        System.out.println(
            "Received response"
        );

        return response;
    }
}
```

Retry:

```java
class RetryHttpClient
        implements HttpClient {

    private final HttpClient client;

    public RetryHttpClient(
            HttpClient client) {

        this.client = client;
    }

    @Override
    public Response send(
            Request request) {

        // simplified retry logic

        return client.send(request);
    }
}
```

Composition:

```java
HttpClient client =
        new BasicHttpClient();

client =
        new RetryHttpClient(client);

client =
        new LoggingHttpClient(client);
```

Again:

```text
Logging
   ↓
Retry
   ↓
Basic HTTP
```

This is very practical.

---

# 32. Decorator can modify before and after

A decorator doesn't have to just add something afterward.

It can act before delegation:

```java
public void operation() {

    doBefore();

    component.operation();
}
```

after:

```java
public void operation() {

    component.operation();

    doAfter();
}
```

or both:

```java
public void operation() {

    doBefore();

    component.operation();

    doAfter();
}
```

This makes Decorator useful for cross-cutting behavior.

---

# 33. Decorator can transform results

Suppose:

```java
interface TextFormatter {

    String format(String text);
}
```

Basic:

```java
class PlainTextFormatter
        implements TextFormatter {

    public String format(
            String text) {

        return text;
    }
}
```

Uppercase decorator:

```java
class UppercaseDecorator
        implements TextFormatter {

    private final TextFormatter formatter;

    public UppercaseDecorator(
            TextFormatter formatter) {

        this.formatter = formatter;
    }

    @Override
    public String format(
            String text) {

        return formatter
                .format(text)
                .toUpperCase();
    }
}
```

Trim decorator:

```java
class TrimDecorator
        implements TextFormatter {

    private final TextFormatter formatter;

    public TrimDecorator(
            TextFormatter formatter) {

        this.formatter = formatter;
    }

    @Override
    public String format(
            String text) {

        return formatter
                .format(text)
                .trim();
    }
}
```

Then:

```java
TextFormatter formatter =
        new PlainTextFormatter();

formatter =
        new TrimDecorator(formatter);

formatter =
        new UppercaseDecorator(
            formatter
        );

String result =
        formatter.format(
            "  hello world  "
        );
```

Result:

```text
HELLO WORLD
```

Decorator can therefore alter inputs, outputs, or side effects.

---

# 34. Common mistake: decorators that don't preserve the contract

Suppose:

```java
interface PaymentProcessor {

    boolean pay(double amount);
}
```

Then:

```java
class BrokenDecorator
        implements PaymentProcessor {

    public boolean pay(double amount) {
        return false;
    }
}
```

but it never delegates to the wrapped payment processor.

That may technically implement the interface, but it isn't functioning as a meaningful decorator.

Most decorators should wrap and extend existing behavior rather than completely ignore the wrapped object.

---

# 35. Common mistake: exposing concrete decorator types

Suppose client code does:

```java
LoggingDecorator logging =
        new LoggingDecorator(...);

logging.someSpecialLoggingMethod();
```

Now your client becomes coupled to the concrete decorator.

Usually you'd prefer:

```java
NotificationSender sender =
        new LoggingDecorator(...);
```

and interact through the common abstraction.

That preserves substitutability.

---

# 36. Common mistake: too many tiny layers

Decorator is powerful, but you can overdo it.

Imagine debugging:

```text
TracingDecorator
   ↓
LoggingDecorator
   ↓
MetricsDecorator
   ↓
RetryDecorator
   ↓
CacheDecorator
   ↓
ValidationDecorator
   ↓
AuthorizationDecorator
   ↓
ActualService
```

This can become difficult to trace.

So composition is flexible, but excessive wrapper chains can reduce readability.

Good architecture still requires judgment.

---

# 37. Common mistake: hidden order dependency

Suppose:

```text
Compression
  ↓
Encryption
```

versus:

```text
Encryption
  ↓
Compression
```

Those are not necessarily equivalent.

Compressing encrypted data may work very differently from encrypting compressed data.

So if decorator order matters, that should be intentional and documented.

---

# 38. Real-world security example

Suppose:

```java
interface MessageSender {

    void send(String message);
}
```

Base:

```java
class NetworkMessageSender
        implements MessageSender {

    public void send(
            String message) {

        System.out.println(
            "Sending: " + message
        );
    }
}
```

Encryption decorator:

```java
class EncryptedMessageSender
        implements MessageSender {

    private final MessageSender sender;

    public EncryptedMessageSender(
            MessageSender sender) {

        this.sender = sender;
    }

    @Override
    public void send(
            String message) {

        String encrypted =
                encrypt(message);

        sender.send(encrypted);
    }

    private String encrypt(
            String message) {

        return "encrypted("
                + message
                + ")";
    }
}
```

Logging decorator:

```java
class LoggingMessageSender
        implements MessageSender {

    private final MessageSender sender;

    public LoggingMessageSender(
            MessageSender sender) {

        this.sender = sender;
    }

    @Override
    public void send(
            String message) {

        System.out.println(
            "Sending message"
        );

        sender.send(message);
    }
}
```

Then:

```java
MessageSender sender =
        new NetworkMessageSender();

sender =
        new EncryptedMessageSender(
            sender
        );

sender =
        new LoggingMessageSender(
            sender
        );
```

That's dynamic composition of concerns.

---

# 39. Recognition clues

Decorator is a strong candidate when you hear things like:

- behavior should be added without changing the original class,
- multiple optional behaviors may be combined in arbitrary ways,
- inheritance would require too many subclasses,
- behavior needs to be enabled or disabled dynamically,
- several wrappers should still look like the same original interface.

The strongest clue is:

> **I want to keep the same interface while layering additional behavior around an object.**

---

# 40. Interview answer

If an interviewer asks:

> What is the Decorator Pattern?

A strong answer is:

> Decorator is a structural design pattern that adds behavior to an object dynamically by wrapping it in another object implementing the same interface. Because decorators and the wrapped component share the same abstraction, multiple decorators can be composed without modifying the original class or creating large inheritance hierarchies.

Then give the coffee example:

> A `Coffee` implements `Beverage`, while `MilkDecorator` and `SugarDecorator` also implement `Beverage` and wrap another `Beverage`. This allows combinations like coffee with milk and sugar without creating a separate subclass for every combination.

---

# 41. The big lesson behind Decorator

The deeper idea is not really about coffee.

It's about replacing:

```text
inheritance-based feature combinations
```

with:

```text
composition-based feature combinations
```

Instead of:

```text
Base
├── A
├── B
├── AB
├── AC
├── BC
├── ABC
└── ...
```

we get:

```text
Base
 ↓
A
 ↓
B
 ↓
C
```

assembled however we need.

That's one of the strongest arguments for composition in object-oriented design.

---

# What we've covered so far

You've now learned two structural patterns:

```text
Adapter
→ Make incompatible interfaces work together.

Decorator
→ Add behavior by wrapping an object
  with another object using the same interface.
```

The easiest distinction is:

```text
Adapter:
"I need a different interface."

Decorator:
"I need additional behavior."
```

# Next: Lesson 14 — Facade Pattern

Now imagine an online purchase requires:

```java
inventory.checkStock();
fraudService.verify();
paymentGateway.charge();
shippingService.schedule();
invoiceService.generate();
emailService.send();
analytics.track();
```

A client shouldn't necessarily need to understand and coordinate that entire subsystem.

A **Facade** can expose something much simpler:

```java
checkoutFacade.placeOrder(order);
```

while hiding all the subsystem complexity behind it.

Lesson 14 will cover **Facade**, including subsystem orchestration, reducing coupling, API/service-layer facades, Facade vs Adapter, Facade vs Mediator, Facade vs Service classes, and when a facade becomes a dangerous god object.
