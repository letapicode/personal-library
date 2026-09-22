# Lesson 12 — Adapter Pattern

Now we begin the **Structural Design Patterns**.

Structural patterns focus on this question:

> How should classes and objects be connected so they can work together cleanly?

The **Adapter Pattern** is one of the easiest structural patterns to recognize in real software.

Its core idea is:

> Make two incompatible interfaces work together without changing their existing code.

Think about a physical travel adapter.

Your laptop charger has one plug shape.

The wall socket has another.

Instead of rebuilding the charger or rewiring the building, you put an adapter between them.

Software adapters do the same thing.

---

# 1. The problem

Suppose your application expects this interface:

```java
interface PaymentProcessor {

    void pay(double amount);
}
```

Your checkout system is written against it:

```java
class CheckoutService {

    private final PaymentProcessor processor;

    public CheckoutService(
            PaymentProcessor processor) {

        this.processor = processor;
    }

    public void checkout(double amount) {
        processor.pay(amount);
    }
}
```

Everything looks good.

Now your company buys a third-party payment library.

Unfortunately, that library looks like this:

```java
class LegacyPaymentGateway {

    public void makePaymentInCents(
            int amountInCents) {

        System.out.println(
            "Legacy payment: "
            + amountInCents
            + " cents"
        );
    }
}
```

Your application expects:

```java
pay(double amount)
```

but the third-party library provides:

```java
makePaymentInCents(int cents)
```

Those interfaces are incompatible.

---

# 2. Bad solution: change your whole application

You could modify `CheckoutService`:

```java
class CheckoutService {

    private final LegacyPaymentGateway gateway;

    public CheckoutService(
            LegacyPaymentGateway gateway) {

        this.gateway = gateway;
    }

    public void checkout(double amount) {

        int cents =
                (int) (amount * 100);

        gateway.makePaymentInCents(cents);
    }
}
```

But now your business code knows:

```text
LegacyPaymentGateway
cents conversion
third-party method names
third-party API details
```

That's tight coupling.

If the vendor changes, your business code changes.

And now you've broken the clean `PaymentProcessor` abstraction you already had.

---

# 3. Better idea: introduce an adapter

We'll create:

```java
class LegacyPaymentAdapter
        implements PaymentProcessor {

    private final LegacyPaymentGateway gateway;

    public LegacyPaymentAdapter(
            LegacyPaymentGateway gateway) {

        this.gateway = gateway;
    }

    @Override
    public void pay(double amount) {

        int cents =
                (int) Math.round(
                    amount * 100
                );

        gateway.makePaymentInCents(cents);
    }
}
```

Now:

```java
LegacyPaymentGateway legacyGateway =
        new LegacyPaymentGateway();

PaymentProcessor processor =
        new LegacyPaymentAdapter(
            legacyGateway
        );

CheckoutService checkout =
        new CheckoutService(processor);

checkout.checkout(49.99);
```

The application still talks to:

```java
PaymentProcessor
```

The adapter translates that call into the legacy API.

---

# 4. Structure

Conceptually:

```text
CheckoutService
      |
      v
PaymentProcessor
      ^
      |
LegacyPaymentAdapter
      |
      v
LegacyPaymentGateway
```

The adapter sits in the middle.

Its job is to translate between:

```text
what the client expects
```

and:

```text
what the existing component provides
```

---

# 5. Adapter terminology

The classic pattern has several roles.

### Client

The code trying to use something.

Here:

```java
CheckoutService
```

### Target

The interface the client expects.

Here:

```java
PaymentProcessor
```

### Adaptee

The incompatible existing class.

Here:

```java
LegacyPaymentGateway
```

### Adapter

The object translating between them.

Here:

```java
LegacyPaymentAdapter
```

So:

```text
Client
  ↓
Target
  ↑
Adapter
  ↓
Adaptee
```

Those four names are useful in interviews.

---

# 6. Why not just modify the third-party class?

Because often you cannot.

It may be:

```text
a closed-source library
a vendor SDK
legacy code
generated code
code owned by another team
```

Even if you technically can change it, you may not want to.

Changing external or mature code creates unnecessary risk.

Adapter lets you leave both sides alone.

---

# 7. Real-world example: old printer API

Suppose your system expects:

```java
interface Printer {

    void print(String document);
}
```

But an old device SDK provides:

```java
class LegacyPrinter {

    public void printTextFile(
            String text,
            int copies) {

        System.out.println(
            "Printing "
            + copies
            + " copies of "
            + text
        );
    }
}
```

Adapter:

```java
class PrinterAdapter
        implements Printer {

    private final LegacyPrinter printer;

    public PrinterAdapter(
            LegacyPrinter printer) {

        this.printer = printer;
    }

    @Override
    public void print(
            String document) {

        printer.printTextFile(
            document,
            1
        );
    }
}
```

Now the rest of the application doesn't care that the actual printer uses a weird old API.

---

# 8. Adapter can transform data too

Adapters don't merely rename methods.

They often convert:

```text
types
units
formats
structures
exceptions
protocols
```

For example, your application works in dollars:

```java
pay(10.50)
```

The legacy system works in cents:

```java
makePaymentInCents(1050)
```

The adapter transforms the data.

Another example:

Your system uses:

```java
LocalDate
```

An old API expects:

```java
String date
```

such as:

```text
2026/09/17
```

The adapter may convert between those forms.

---

# 9. Adapter for DTO conversion

This is very common in backend applications.

Suppose your internal model is:

```java
class User {

    private String name;
    private String email;

    public User(
            String name,
            String email) {

        this.name = name;
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }
}
```

But a vendor API expects:

```java
class VendorCustomerRequest {

    private String fullName;
    private String emailAddress;

    public VendorCustomerRequest(
            String fullName,
            String emailAddress) {

        this.fullName = fullName;
        this.emailAddress = emailAddress;
    }
}
```

You don't want business code constantly converting:

```java
new VendorCustomerRequest(
    user.getName(),
    user.getEmail()
);
```

throughout the application.

You can isolate that translation in an adapter.

---

# 10. API adapter example

Suppose your system has:

```java
interface CustomerService {

    void createCustomer(User user);
}
```

Third-party SDK:

```java
class VendorCustomerApi {

    public void create(
            VendorCustomerRequest request) {

        System.out.println(
            "Vendor customer created"
        );
    }
}
```

Adapter:

```java
class VendorCustomerAdapter
        implements CustomerService {

    private final VendorCustomerApi api;

    public VendorCustomerAdapter(
            VendorCustomerApi api) {

        this.api = api;
    }

    @Override
    public void createCustomer(
            User user) {

        VendorCustomerRequest request =
                new VendorCustomerRequest(
                    user.getName(),
                    user.getEmail()
                );

        api.create(request);
    }
}
```

Now:

```java
CustomerService customers =
        new VendorCustomerAdapter(
            new VendorCustomerApi()
        );
```

Your core application stays vendor-independent.

That's extremely valuable.

---

# 11. Exception translation

Adapters can also translate exceptions.

Suppose the vendor library throws:

```java
VendorApiException
```

but your application wants:

```java
PaymentException
```

Adapter:

```java
class LegacyPaymentAdapter
        implements PaymentProcessor {

    private final LegacyPaymentGateway gateway;

    public LegacyPaymentAdapter(
            LegacyPaymentGateway gateway) {

        this.gateway = gateway;
    }

    @Override
    public void pay(double amount) {

        try {

            int cents =
                    (int) Math.round(
                        amount * 100
                    );

            gateway.makePaymentInCents(
                cents
            );

        } catch (VendorApiException e) {

            throw new PaymentException(
                "Payment failed",
                e
            );
        }
    }
}
```

Now vendor-specific exceptions don't leak into business logic.

That's another major Adapter use case.

---

# 12. Adapter protects your domain

This is an important architectural idea.

Suppose your business code directly imports:

```text
Stripe SDK classes
AWS SDK classes
Twilio SDK classes
Firebase SDK classes
vendor DTOs
```

everywhere.

Then your business layer becomes deeply coupled to external technology.

Instead:

```text
Business Code
      |
      v
Your Interface
      |
      v
Adapter
      |
      v
External SDK
```

The adapter creates a boundary.

This is closely related to:

```text
Hexagonal Architecture
Ports and Adapters
Clean Architecture
```

which we mentioned during DIP.

---

# 13. Adapter and Dependency Inversion

Remember DIP:

> Business logic should depend on abstractions rather than low-level details.

Adapter is one of the best ways to make DIP practical.

For example:

```java
interface SmsSender {

    void send(
        String phone,
        String message
    );
}
```

Your business service:

```java
class OtpService {

    private final SmsSender sender;

    public OtpService(
            SmsSender sender) {

        this.sender = sender;
    }

    public void sendOtp(
            String phone,
            String otp) {

        sender.send(
            phone,
            "OTP: " + otp
        );
    }
}
```

Third-party Twilio-like SDK:

```java
class ExternalSmsClient {

    public void dispatch(
            String destination,
            String body) {
        ...
    }
}
```

Adapter:

```java
class ExternalSmsAdapter
        implements SmsSender {

    private final ExternalSmsClient client;

    public ExternalSmsAdapter(
            ExternalSmsClient client) {

        this.client = client;
    }

    @Override
    public void send(
            String phone,
            String message) {

        client.dispatch(
            phone,
            message
        );
    }
}
```

Your business service knows nothing about the external SDK.

That's DIP + Adapter working together.

---

# 14. Object Adapter

The examples so far use **composition**.

Example:

```java
class LegacyPaymentAdapter
        implements PaymentProcessor {

    private final LegacyPaymentGateway gateway;
}
```

The adapter **has a** legacy gateway.

This is called an:

> **Object Adapter**

Structure:

```text
Adapter
  |
  | has-a
  v
Adaptee
```

This is usually the preferred style in Java.

Why?

Because composition is flexible.

---

# 15. Class Adapter

Another version uses inheritance.

Imagine:

```java
class LegacyPrinter {

    public void printLegacy(
            String text) {
        ...
    }
}
```

Adapter:

```java
class PrinterAdapter
        extends LegacyPrinter
        implements Printer {

    @Override
    public void print(
            String document) {

        printLegacy(document);
    }
}
```

Now the adapter **is a** legacy printer.

This style is often called a:

> **Class Adapter**

---

# 16. Object Adapter vs Class Adapter

Object adapter:

```java
class Adapter
        implements Target {

    private Adaptee adaptee;
}
```

Class adapter:

```java
class Adapter
        extends Adaptee
        implements Target {
}
```

Object adapters are generally more flexible because:

```text
composition avoids inheritance restrictions
adaptees can be replaced dynamically
you aren't tightly tied to one implementation hierarchy
```

And Java doesn't support multiple class inheritance, which limits certain class-adapter forms.

So in Java, composition-based object adapters are usually the more common choice.

---

# 17. Adapter can wrap several adaptees

An adapter doesn't necessarily wrap exactly one object.

Imagine your application wants:

```java
interface WeatherService {

    Weather getWeather(
            String city);
}
```

But an external system requires:

```text
GeocodingClient
WeatherApiClient
UnitConversionService
```

Your adapter might coordinate all three.

```java
class ExternalWeatherAdapter
        implements WeatherService {

    private final GeocodingClient geocoder;
    private final WeatherApiClient api;
    private final UnitConverter converter;

    ...
}
```

As long as the main purpose is:

> Translate an external/incompatible subsystem into the interface the client expects,

it's still adapter-like.

---

# 18. Real example: media player

Suppose our application supports:

```java
interface MediaPlayer {

    void play(String filename);
}
```

Current implementation:

```java
class Mp3Player
        implements MediaPlayer {

    @Override
    public void play(
            String filename) {

        System.out.println(
            "Playing MP3: "
            + filename
        );
    }
}
```

Now we acquire an advanced player library:

```java
class AdvancedVideoPlayer {

    public void playMp4(
            String filename) {

        System.out.println(
            "Playing MP4: "
            + filename
        );
    }
}
```

Adapter:

```java
class VideoPlayerAdapter
        implements MediaPlayer {

    private final AdvancedVideoPlayer player;

    public VideoPlayerAdapter(
            AdvancedVideoPlayer player) {

        this.player = player;
    }

    @Override
    public void play(
            String filename) {

        player.playMp4(filename);
    }
}
```

Now both implementations conform to:

```java
MediaPlayer
```

---

# 19. Adapter and legacy systems

This pattern is especially useful when modernizing old systems.

Suppose your old system contains:

```java
class LegacyOrderSystem {

    public String submitOrder(
            String serializedOrder) {
        ...
    }
}
```

Your new application wants:

```java
interface OrderGateway {

    OrderResult submit(
            Order order);
}
```

Instead of rewriting the legacy system immediately, create:

```java
class LegacyOrderAdapter
        implements OrderGateway {
    ...
}
```

The adapter might:

```text
convert Order → legacy string
call old system
parse legacy response → OrderResult
translate exceptions
log compatibility issues
```

This lets you incrementally replace old technology.

---

# 20. Adapter as an anti-corruption layer

In domain-driven design, you may hear:

> Anti-Corruption Layer

The idea is similar.

Suppose an external vendor has strange concepts:

```text
acct_holder
billing_party
transaction_code
settlement_mode
```

Your domain uses:

```text
Customer
Payment
Refund
Invoice
```

You don't want the external vendor's model to infect your entire system.

An adapter layer translates between the two models.

Conceptually:

```text
Your Domain
    |
    v
Adapter / Translation Layer
    |
    v
External Domain
```

This preserves the vocabulary and design of your own application.

---

# 21. Adapter vs Facade

This distinction is very important.

We'll study Facade properly later.

Adapter:

> Changes one interface into another interface expected by the client.

Facade:

> Provides a simpler interface over a complicated subsystem.

Example Adapter:

```text
App expects:
pay(double)

Vendor provides:
chargeCents(int)

Adapter converts between them.
```

Example Facade:

```text
Complex subsystem:
Inventory
Payment
Shipping
Email
FraudDetection

Facade:
placeOrder()
```

So:

```text
Adapter
→ compatibility

Facade
→ simplicity
```

---

# 22. Adapter vs Decorator

Decorator is another structural pattern we'll study soon.

Adapter:

> Changes the interface.

Decorator:

> Keeps the same interface but adds behavior.

Example Adapter:

```text
VendorPaymentGateway
        ↓
PaymentProcessor adapter
```

Different interface.

Example Decorator:

```text
PaymentProcessor
       ↓
LoggingPaymentProcessor
       ↓
RetryPaymentProcessor
```

Same interface, extra behavior.

A useful mental distinction:

```text
Adapter
→ "Make it fit."

Decorator
→ "Add something."
```

---

# 23. Adapter vs Proxy

Proxy also wraps another object.

But the intention is different.

Adapter:

> Translate an incompatible interface.

Proxy:

> Control access to another object.

A proxy might add:

```text
lazy loading
authorization
caching
remote access
logging
```

while keeping essentially the same interface.

We'll cover Proxy later.

---

# 24. Adapter vs Bridge

Bridge separates two independent dimensions of variation.

Adapter usually connects systems that already exist and don't match.

A useful mental distinction:

```text
Adapter
→ fix incompatibility

Bridge
→ design independent variation intentionally
```

We'll explore Bridge later.

---

# 25. Common example: external JSON format

Imagine an external API returns:

```json
{
  "full_name": "Alice Smith",
  "mail": "alice@example.com",
  "years": 28
}
```

Your domain wants:

```java
class Customer {

    private String name;
    private String email;
    private int age;
}
```

A mapping adapter can translate:

```text
full_name → name
mail      → email
years     → age
```

The rest of your application never needs to know the vendor JSON naming scheme.

This is an everyday form of adaptation.

---

# 26. Adapter and multiple vendors

Suppose your application defines:

```java
interface PaymentGateway {

    PaymentResult charge(
            Money amount);
}
```

Then you might have:

```text
StripePaymentAdapter
PayPalPaymentAdapter
AdyenPaymentAdapter
```

Each adapter translates its vendor's API into your interface.

Conceptually:

```text
                    PaymentGateway
                    /      |      \
                   /       |       \
              Stripe     PayPal    Adyen
              Adapter    Adapter   Adapter
                 |          |         |
                 v          v         v
             Stripe SDK PayPal SDK Adyen SDK
```

Your checkout code doesn't care which vendor is underneath.

This is a very common production architecture.

---

# 27. Swapping vendors becomes easier

Suppose:

```java
class CheckoutService {

    private final PaymentGateway gateway;

    public CheckoutService(
            PaymentGateway gateway) {

        this.gateway = gateway;
    }
}
```

Production:

```java
PaymentGateway gateway =
        new StripePaymentAdapter(
            stripeClient
        );
```

Later:

```java
PaymentGateway gateway =
        new AdyenPaymentAdapter(
            adyenClient
        );
```

`CheckoutService` remains unchanged.

This combines:

```text
Adapter
DIP
OCP
Dependency Injection
```

beautifully.

---

# 28. Testing becomes easier

Your business service depends on:

```java
PaymentGateway
```

So unit tests can use:

```java
class FakePaymentGateway
        implements PaymentGateway {

    private boolean charged;

    @Override
    public PaymentResult charge(
            Money amount) {

        charged = true;

        return PaymentResult.success();
    }
}
```

Your test does not need the real third-party API.

Again, Adapter helps create a clean boundary.

---

# 29. Where should conversion logic live?

Suppose vendor API requires cents.

Bad:

```java
class CheckoutService {

    void checkout(double dollars) {

        int cents =
            (int) (dollars * 100);

        vendor.charge(cents);
    }
}
```

Better:

```java
class VendorPaymentAdapter {

    void pay(double dollars) {

        int cents =
            convertToCents(dollars);

        vendor.charge(cents);
    }
}
```

Why?

Because cents are a vendor integration detail.

Business logic shouldn't need to know about it.

---

# 30. Adapters can protect against vendor changes

Suppose Vendor API v1 provides:

```java
charge(int cents)
```

Then v2 changes to:

```java
createTransaction(
    BigDecimal amount,
    Currency currency
)
```

If your code directly uses the vendor everywhere, dozens of classes may need changes.

If all vendor access goes through:

```java
PaymentGateway
```

only the adapter may need to change.

This reduces the blast radius.

Remember that idea from SRP?

Here it appears again.

---

# 31. Adapter and SRP

A good adapter has one focused responsibility:

> Translate between two interfaces/models.

It should not become:

```text
payment adapter
+
business rules
+
report generator
+
database repository
+
email sender
```

Keep integration translation separate from domain logic.

---

# 32. Adapter and OCP

Suppose:

```java
PaymentGateway
```

already exists.

Adding another vendor:

```java
class NewVendorAdapter
        implements PaymentGateway
```

doesn't require changing business code.

That's OCP.

---

# 33. Adapter and LSP

All adapters implementing:

```java
PaymentGateway
```

must genuinely honor its contract.

If one adapter says:

```java
charge(amount)
```

but silently ignores the charge, it violates expectations.

So LSP still matters.

---

# 34. Adapter and ISP

Don't create a huge interface like:

```java
interface VendorAdapter {

    void pay();

    void sendEmail();

    void uploadFile();

    void queryWeather();

    void createInvoice();
}
```

Your target abstraction should remain focused.

For example:

```java
PaymentGateway
```

should represent payment functionality only.

---

# 35. Common mistake: leaking vendor types

Suppose you define:

```java
interface PaymentGateway {

    StripeChargeResponse charge(
            StripePaymentRequest request);
}
```

This isn't much of an abstraction.

Your business layer still knows Stripe types.

A stronger boundary:

```java
interface PaymentGateway {

    PaymentResult charge(
            PaymentRequest request);
}
```

where:

```text
PaymentRequest
PaymentResult
```

belong to your application.

Then the adapter converts to and from Stripe types internally.

That's much cleaner.

---

# 36. Common mistake: pass-through adapter

Suppose:

```java
class StripeAdapter
        implements PaymentGateway {

    public void charge(double amount) {
        stripe.charge(amount);
    }
}
```

This may still be useful if it isolates the dependency.

But if your abstraction is identical to the vendor's API and offers no meaningful boundary, ask whether the adapter adds enough value.

Adapters are most useful when they isolate incompatibility or protect a domain boundary.

---

# 37. Common mistake: putting business rules in the adapter

Bad:

```java
class StripeAdapter {

    public void charge(Order order) {

        if (order.isVip()) {
            applyVipDiscount();
        }

        calculateTax();

        stripe.charge(...);
    }
}
```

VIP discounts and tax rules are business logic.

The adapter should usually focus on Stripe integration.

A better design:

```text
CheckoutService
    → calculates final amount

StripeAdapter
    → translates charge request to Stripe
```

---

# 38. Two-way adapters

Sometimes you need adaptation in both directions.

For example:

```text
Your Request
→ Vendor Request

Vendor Response
→ Your Response
```

Adapter:

```java
class VendorPaymentAdapter
        implements PaymentGateway {

    public PaymentResult charge(
            PaymentRequest request) {

        VendorRequest vendorRequest =
                mapRequest(request);

        VendorResponse response =
                client.charge(
                    vendorRequest
                );

        return mapResponse(response);
    }
}
```

So adaptation often occurs both entering and leaving the external system.

---

# 39. Adapter for file formats

Suppose your application expects:

```java
interface DataReader {

    List<Record> read(
            String file);
}
```

CSV library:

```java
class CsvLibrary {

    CsvTable parseCsv(
            String file) {
        ...
    }
}
```

Adapter:

```java
class CsvReaderAdapter
        implements DataReader {

    private final CsvLibrary library;

    public CsvReaderAdapter(
            CsvLibrary library) {

        this.library = library;
    }

    @Override
    public List<Record> read(
            String file) {

        CsvTable table =
                library.parseCsv(file);

        return convert(table);
    }
}
```

Now your application works with:

```java
DataReader
```

rather than being tied to the CSV library.

---

# 40. Adapter and Java standard library thinking

You use adapter-like ideas frequently without noticing.

For example, converting:

```text
Enumeration
→ Iterator
```

or wrapping older APIs behind newer interfaces follows the same general idea:

> Make an existing component usable through the interface expected by current code.

The specific implementation may not always be formally labeled "Adapter," but the design reasoning is the same.

---

# 41. Interview question

If asked:

> What is the Adapter Pattern?

A strong answer is:

> Adapter is a structural design pattern that allows incompatible interfaces to work together. It wraps an existing class and translates the interface expected by the client into calls understood by the wrapped class.

Then give the payment example:

> If my application expects `PaymentProcessor.pay(double)` but a vendor SDK exposes `makePaymentInCents(int)`, I can create an adapter implementing `PaymentProcessor` that converts dollars to cents and delegates to the vendor SDK.

That's a strong interview answer.

---

# 42. Object Adapter interview answer

If asked:

> What's the difference between object adapter and class adapter?

You can say:

> An object adapter uses composition: it contains the adaptee and delegates to it. A class adapter uses inheritance to adapt the existing class. In Java, composition-based object adapters are usually more flexible and more common.

---

# 43. Recognition clues

Think Adapter when you hear:

```text
"third-party API doesn't match ours"

"legacy API uses a different interface"

"we can't modify this existing class"

"convert vendor DTOs to our domain model"

"our code expects interface A,
but the library gives interface B"

"we want to replace vendor-specific types
with our own abstraction"
```

Those are strong Adapter signals.

---

# 44. Mental model

Remember this:

```text
Client
  |
  | expects
  v
Target Interface
  ^
  |
Adapter
  |
  | translates
  v
Adaptee
```

Or even simpler:

```text
Adapter
=
translator between interfaces
```

---

# 45. Structural patterns roadmap

We have now started Structural Patterns:

```text
Adapter
Decorator
Facade
Composite
Proxy
Bridge
Flyweight
```

They answer different structural questions.

A useful preview:

```text
Adapter
→ How can incompatible interfaces work together?

Decorator
→ How can I add behavior dynamically?

Facade
→ How can I simplify a complex subsystem?

Composite
→ How can individual objects and groups
  be treated uniformly?

Proxy
→ How can I control access to another object?

Bridge
→ How can two dimensions vary independently?

Flyweight
→ How can many objects share common state
  to save memory?
```

# Next: Lesson 13 — Decorator Pattern

Decorator is especially important because it teaches us how to add behavior without creating huge inheritance trees.

Imagine:

```text
Coffee
```

Then requirements appear:

```text
Coffee + Milk
Coffee + Sugar
Coffee + Milk + Sugar
Coffee + Whipped Cream
Coffee + Milk + Whipped Cream
```

Inheritance quickly becomes:

```text
Coffee
MilkCoffee
SugarCoffee
MilkSugarCoffee
WhippedCoffee
MilkWhippedCoffee
...
```

That explodes combinatorially.

Decorator solves this by **wrapping objects with other objects that implement the same interface**:

```text
Coffee
  ↓
MilkDecorator
  ↓
SugarDecorator
  ↓
WhippedCreamDecorator
```

while callers still see:

```java
Beverage
```

That's **Lesson 13 — Decorator Pattern**, and it's one of the best demonstrations of why composition is often more powerful than inheritance.
