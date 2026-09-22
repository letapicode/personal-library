# Lesson 14 — Facade Pattern

The **Facade Pattern** is used when a subsystem is complicated, but most clients only need a simple way to use it.

The core idea is:

> Provide one simple interface in front of a more complex set of classes.

Think of a hotel front desk. You don't personally coordinate housekeeping, billing, maintenance, security, and room assignment. You talk to the front desk, and it coordinates the subsystem for you.

Software facades work the same way.

---

# 1. The problem

Imagine an e-commerce checkout.

Placing an order requires several systems:

```java
inventoryService.checkStock(order);

fraudService.validate(order);

paymentGateway.charge(order);

shippingService.schedule(order);

invoiceService.generate(order);

emailService.sendConfirmation(order);

analyticsService.trackPurchase(order);
```

Now suppose your controller has to coordinate everything:

```java
class CheckoutController {

    public void checkout(Order order) {

        inventoryService.checkStock(order);

        fraudService.validate(order);

        paymentGateway.charge(order);

        shippingService.schedule(order);

        invoiceService.generate(order);

        emailService.sendConfirmation(order);

        analyticsService.trackPurchase(order);
    }
}
```

This works, but `CheckoutController` knows far too much about the checkout subsystem.

It knows:

```text
which services exist
which order to call them in
which ones are required
how the overall workflow works
```

That creates coupling.

---

# 2. The client shouldn't know everything

The controller really wants to say:

```java
checkout(order);
```

It shouldn't necessarily need to understand:

```text
inventory
fraud
payment
shipping
invoice generation
email
analytics
```

Those are implementation details of the checkout workflow.

This is exactly where Facade can help.

---

# 3. Introduce a facade

Create:

```java
class CheckoutFacade {

    private final InventoryService inventory;
    private final FraudService fraud;
    private final PaymentGateway payment;
    private final ShippingService shipping;
    private final InvoiceService invoice;
    private final EmailService email;
    private final AnalyticsService analytics;

    public CheckoutFacade(
            InventoryService inventory,
            FraudService fraud,
            PaymentGateway payment,
            ShippingService shipping,
            InvoiceService invoice,
            EmailService email,
            AnalyticsService analytics) {

        this.inventory = inventory;
        this.fraud = fraud;
        this.payment = payment;
        this.shipping = shipping;
        this.invoice = invoice;
        this.email = email;
        this.analytics = analytics;
    }

    public void placeOrder(Order order) {

        inventory.checkStock(order);

        fraud.validate(order);

        payment.charge(order);

        shipping.schedule(order);

        invoice.generate(order);

        email.sendConfirmation(order);

        analytics.trackPurchase(order);
    }
}
```

Now the controller becomes:

```java
class CheckoutController {

    private final CheckoutFacade checkoutFacade;

    public CheckoutController(
            CheckoutFacade checkoutFacade) {

        this.checkoutFacade =
                checkoutFacade;
    }

    public void checkout(Order order) {

        checkoutFacade.placeOrder(order);
    }
}
```

Much simpler.

---

# 4. Structure

Before:

```text
CheckoutController
   |
   +--> InventoryService
   +--> FraudService
   +--> PaymentGateway
   +--> ShippingService
   +--> InvoiceService
   +--> EmailService
   +--> AnalyticsService
```

After:

```text
CheckoutController
        |
        v
 CheckoutFacade
        |
        +--> InventoryService
        +--> FraudService
        +--> PaymentGateway
        +--> ShippingService
        +--> InvoiceService
        +--> EmailService
        +--> AnalyticsService
```

The complexity still exists.

Facade does **not** eliminate complexity.

It moves that complexity behind a cleaner boundary.

That's an important distinction.

---

# 5. Facade definition

A good definition is:

> Facade is a structural design pattern that provides a simplified interface to a more complex subsystem.

The word:

> **simplified**

is crucial.

The subsystem might expose 50 different operations.

The facade might expose:

```java
placeOrder()
cancelOrder()
refundOrder()
```

because those are what clients actually care about.

---

# 6. Home theater example

This is a classic Facade example.

Imagine these classes:

```java
class Projector {

    public void on() {
        System.out.println("Projector on");
    }

    public void setInput(String input) {
        System.out.println(
            "Input: " + input
        );
    }

    public void off() {
        System.out.println("Projector off");
    }
}
```

```java
class SoundSystem {

    public void on() {
        System.out.println("Sound on");
    }

    public void setVolume(int volume) {
        System.out.println(
            "Volume: " + volume
        );
    }

    public void off() {
        System.out.println("Sound off");
    }
}
```

```java
class StreamingPlayer {

    public void on() {
        System.out.println("Player on");
    }

    public void play(String movie) {
        System.out.println(
            "Playing " + movie
        );
    }

    public void off() {
        System.out.println("Player off");
    }
}
```

Without Facade:

```java
projector.on();
projector.setInput("HDMI");

soundSystem.on();
soundSystem.setVolume(20);

player.on();
player.play("Interstellar");
```

Every client must know the setup sequence.

---

# 7. Home theater facade

```java
class HomeTheaterFacade {

    private final Projector projector;
    private final SoundSystem sound;
    private final StreamingPlayer player;

    public HomeTheaterFacade(
            Projector projector,
            SoundSystem sound,
            StreamingPlayer player) {

        this.projector = projector;
        this.sound = sound;
        this.player = player;
    }

    public void watchMovie(String movie) {

        projector.on();
        projector.setInput("HDMI");

        sound.on();
        sound.setVolume(20);

        player.on();
        player.play(movie);
    }

    public void endMovie() {

        player.off();
        sound.off();
        projector.off();
    }
}
```

Usage becomes:

```java
HomeTheaterFacade theater =
        new HomeTheaterFacade(
            projector,
            sound,
            player
        );

theater.watchMovie(
        "Interstellar"
);
```

One high-level operation hides the low-level coordination.

---

# 8. Facade doesn't prevent direct subsystem access

This is subtle.

Suppose:

```java
HomeTheaterFacade facade;
```

exists.

That doesn't necessarily mean:

```java
Projector
SoundSystem
StreamingPlayer
```

must become inaccessible.

A client that genuinely needs advanced projector control might still use:

```java
projector.setInput(...);
```

The facade provides a convenient path.

It doesn't have to become a prison around the subsystem.

That's different from some patterns whose purpose is strict encapsulation.

---

# 9. Facade reduces coupling

Without Facade, client code might depend on seven subsystem classes.

With Facade:

```text
Client
  |
  v
CheckoutFacade
```

The client now depends mainly on one abstraction.

That means subsystem changes are less likely to affect the client.

For example, suppose we replace:

```text
EmailService
```

with:

```text
NotificationService
```

If the controller directly depended on `EmailService`, it might need changes.

With a facade, only:

```java
CheckoutFacade
```

may need to change.

This reduces the **blast radius** of subsystem changes.

---

# 10. Another example — video conversion

Imagine converting a video requires:

```text
CodecFactory
VideoFile
AudioMixer
BitrateReader
Codec
CompressionEngine
```

The client probably doesn't care about all of that.

It wants:

```java
converter.convert(
    "video.mov",
    "mp4"
);
```

Facade:

```java
class VideoConverterFacade {

    public void convert(
            String filename,
            String format) {

        VideoFile file =
                new VideoFile(filename);

        Codec codec =
                CodecFactory
                    .forFormat(format);

        BitrateReader reader =
                new BitrateReader();

        AudioMixer mixer =
                new AudioMixer();

        // coordinate complex subsystem

        System.out.println(
            "Converted to " + format
        );
    }
}
```

The complexity is hidden behind:

```java
convert(...)
```

That's a very natural Facade use case.

---

# 11. Facade and service layers

In backend applications, many service classes are facade-like.

For example:

```java
class OrderApplicationService {

    public OrderResult placeOrder(
            PlaceOrderCommand command) {

        // coordinate domain + infrastructure
    }
}
```

This service may call:

```text
OrderRepository
PricingService
PaymentGateway
InventoryService
NotificationService
```

From the controller's perspective:

```java
orderService.placeOrder(command);
```

is a simple entry point into a complex subsystem.

That's facade-like architecture.

---

# 12. Facade vs Adapter

This is one of the most important comparisons.

Adapter asks:

> How do I make incompatible interfaces work together?

Facade asks:

> How do I make a complex subsystem easier to use?

Adapter:

```text
Client expects:
pay(double)

Vendor gives:
chargeCents(int)

Adapter translates.
```

Facade:

```text
Client wants:
placeOrder()

Subsystem requires:
inventory
fraud
payment
shipping
email
```

Facade simplifies coordination.

A useful memory trick:

```text
Adapter
→ compatibility

Facade
→ simplicity
```

---

# 13. Facade vs Decorator

Decorator:

> Add behavior while preserving essentially the same interface.

Example:

```text
PaymentProcessor
      ↓
LoggingDecorator
      ↓
PaymentProcessor
```

Facade:

> Provide a new simplified interface over multiple subsystem components.

Example:

```text
CheckoutFacade
      ↓
Inventory + Payment + Shipping + Email
```

Decorator wraps primarily to extend behavior.

Facade wraps a subsystem to simplify usage.

---

# 14. Facade vs Proxy

Proxy:

> Controls access to another object.

Examples:

```text
authorization
lazy loading
caching
remote access
```

Facade:

> Simplifies access to a subsystem.

Proxy usually mirrors the underlying object's interface.

Facade often exposes a very different, higher-level interface.

---

# 15. Facade vs Mediator

This one is more subtle.

Mediator coordinates communication **between peer objects**.

Facade provides a simplified entry point **for outside clients**.

Imagine:

```text
UI
 ↓
Facade
 ↓
Subsystem
```

Facade primarily manages the boundary.

Mediator might look like:

```text
Component A
      \
       \
      Mediator
       /
      /
Component B
```

where components communicate through the mediator instead of directly with each other.

We'll study Mediator later.

---

# 16. Facade vs Controller

A web controller's primary responsibility is:

```text
HTTP request
HTTP response
routing
status codes
serialization boundary
```

It should usually not become the subsystem coordinator itself.

Bad:

```java
@PostMapping("/orders")
public ResponseEntity<?> createOrder(...) {

    inventory.check(...);
    payment.charge(...);
    shipping.schedule(...);
    email.send(...);

    ...
}
```

Better:

```java
@PostMapping("/orders")
public ResponseEntity<?> createOrder(...) {

    orderFacade.placeOrder(...);

    ...
}
```

The controller handles HTTP.

The facade/application service handles orchestration.

That aligns nicely with SRP.

---

# 17. Facade and SRP

Facade might appear to violate SRP because it calls many services.

But remember:

> Calling several components does not automatically mean having several responsibilities.

A facade can have one cohesive responsibility:

> Coordinate the checkout use case.

For example:

```java
class CheckoutFacade {

    public void placeOrder(Order order) {
        ...
    }
}
```

Its responsibility is not:

```text
implement payments
implement inventory
implement email
```

It **coordinates** those responsibilities.

The actual implementations remain elsewhere.

---

# 18. Coordination is a responsibility

This is worth emphasizing.

Suppose:

```java
class OrderFacade {

    public void placeOrder(Order order) {

        inventory.reserve(order);

        payment.charge(order);

        shipping.schedule(order);
    }
}
```

It doesn't contain:

```text
SQL inventory logic
Stripe SDK logic
shipping algorithm
```

It simply defines:

> What should happen when an order is placed?

That's orchestration.

Orchestration can be a perfectly valid single responsibility.

---

# 19. Transaction orchestration

Facade-like services often become useful around transactional workflows.

Suppose:

```java
class BankTransferFacade {

    public void transfer(
            Account from,
            Account to,
            Money amount) {

        fraudCheck.verify(from, amount);

        accounts.withdraw(
            from,
            amount
        );

        accounts.deposit(
            to,
            amount
        );

        audit.recordTransfer(
            from,
            to,
            amount
        );

        notifications.notifyTransfer(
            from,
            amount
        );
    }
}
```

The client sees:

```java
transfer(...)
```

instead of manually performing every subsystem step.

---

# 20. Error handling belongs here sometimes

Imagine checkout fails after payment.

The facade might coordinate compensation:

```java
public void placeOrder(Order order) {

    inventory.reserve(order);

    try {

        payment.charge(order);

        shipping.schedule(order);

    } catch (RuntimeException e) {

        inventory.release(order);

        throw e;
    }
}
```

Now clients don't need to know recovery rules.

The facade owns the workflow-level coordination.

That can be a major advantage.

---

# 21. Facade and external APIs

Suppose integrating with a cloud provider requires:

```text
AuthClient
UploadClient
MetadataClient
PermissionClient
RegionResolver
```

Your application could expose:

```java
interface FileStorage {

    void upload(File file);
}
```

Implementation:

```java
class CloudStorageFacade
        implements FileStorage {

    private final AuthClient auth;
    private final UploadClient uploader;
    private final MetadataClient metadata;

    @Override
    public void upload(File file) {

        Token token =
                auth.authenticate();

        uploader.upload(
            token,
            file
        );

        metadata.save(
            file.getName()
        );
    }
}
```

From your application's perspective:

```java
storage.upload(file);
```

The external SDK complexity stays behind the facade.

This can also overlap with Adapter depending on the intent.

Patterns can combine.

---

# 22. Facade and Dependency Inversion

Suppose the controller depends on:

```java
CheckoutFacade
```

But we can go further:

```java
interface CheckoutUseCase {

    CheckoutResult placeOrder(
            Order order
    );
}
```

Then:

```java
class CheckoutFacade
        implements CheckoutUseCase {
    ...
}
```

Controller:

```java
class CheckoutController {

    private final CheckoutUseCase checkout;

    public CheckoutController(
            CheckoutUseCase checkout) {

        this.checkout = checkout;
    }
}
```

Now the client depends on an abstraction.

That's DIP.

---

# 23. Facade and OCP

Imagine `CheckoutFacade` delegates to abstractions:

```java
PaymentGateway payment;
NotificationSender notifications;
ShippingProvider shipping;
```

Then we can replace:

```text
Stripe → PayPal
Email → SMS
FedEx → UPS
```

without rewriting the client's code.

Facade can work very well with OCP and DIP when its dependencies are abstract.

---

# 24. Multiple facades are okay

A large subsystem does not need exactly one gigantic facade.

For example:

```text
E-commerce System
```

might expose:

```java
CheckoutFacade
```

```java
CustomerAccountFacade
```

```java
ReturnsFacade
```

```java
AdminReportingFacade
```

That's usually healthier than:

```java
EverythingFacade
```

with 90 methods.

Facades should stay cohesive around meaningful use cases.

---

# 25. The God Facade problem

A facade can become dangerous if every operation gets dumped into it.

For example:

```java
class ApplicationFacade {

    void login() {}

    void placeOrder() {}

    void refund() {}

    void resetPassword() {}

    void generatePayroll() {}

    void sendNewsletter() {}

    void createInvoice() {}

    void uploadVideo() {}

    void calculateTax() {}

    void backupDatabase() {}
}
```

This is no longer a focused facade.

It has become a god object.

The solution is usually to create facades around cohesive subsystems or use cases.

---

# 26. Don't hide useful functionality unnecessarily

Suppose your facade exposes only:

```java
placeOrder()
```

but advanced clients genuinely need:

```text
checkInventory()
estimateShipping()
calculateTaxes()
```

You have several options.

You can expose additional meaningful facade methods, create another specialized facade, or allow advanced callers to use lower-level services directly when appropriate.

Facade should simplify common usage, not cripple legitimate use cases.

---

# 27. Facade doesn't have to be an interface

This:

```java
class CheckoutFacade {
}
```

is enough.

The pattern doesn't require:

```java
interface CheckoutFacade
```

But if you need:

```text
testing
substitution
multiple implementations
clean architecture boundaries
```

then defining an abstraction may be useful.

Again, patterns don't prescribe unnecessary interfaces.

---

# 28. Testing a facade

Because the facade coordinates collaborators, tests often verify interaction or workflow.

For example:

```java
class FakePaymentGateway
        implements PaymentGateway {

    boolean charged;

    @Override
    public void charge(Order order) {
        charged = true;
    }
}
```

Then:

```java
CheckoutFacade facade =
        new CheckoutFacade(
            fakeInventory,
            fakeFraud,
            fakePayment,
            fakeShipping,
            fakeInvoice,
            fakeEmail,
            fakeAnalytics
        );

facade.placeOrder(order);

assert fakePayment.charged;
assert fakeShipping.scheduled;
```

Dependency injection makes the facade testable.

---

# 29. But constructor explosion can reveal another issue

Imagine:

```java
CheckoutFacade(
    InventoryService inventory,
    FraudService fraud,
    PaymentService payment,
    ShippingService shipping,
    InvoiceService invoice,
    EmailService email,
    AnalyticsService analytics,
    TaxService tax,
    LoyaltyService loyalty,
    RecommendationService recommendations,
    AuditService audit,
    ...
)
```

That's not automatically wrong.

Complex use cases sometimes genuinely coordinate many collaborators.

But it should trigger the question:

> Has this facade become responsible for too much?

Maybe checkout should be divided into smaller workflows.

Maybe some concerns belong behind another higher-level service.

Constructor size is a useful design signal.

---

# 30. Nested facades

Sometimes one facade delegates to smaller facades.

For example:

```text
CheckoutFacade
   |
   +--> PaymentFacade
   |
   +--> FulfillmentFacade
   |
   +--> NotificationFacade
```

Then:

```java
class CheckoutFacade {

    public void placeOrder(Order order) {

        paymentFacade.process(order);

        fulfillmentFacade.fulfill(order);

        notificationFacade.notify(order);
    }
}
```

This can keep complexity manageable in very large systems.

But don't create layers just for the sake of layers.

---

# 31. Real application architecture

A typical layered application might look like:

```text
HTTP Controller
      |
      v
Application Service / Facade
      |
      v
Domain Services
      |
      +--> Repository
      +--> Payment Gateway
      +--> Notification Gateway
      +--> Shipping Gateway
```

Each layer has a different responsibility.

Controller:

```text
transport concerns
```

Facade/application service:

```text
use-case orchestration
```

Domain:

```text
business rules
```

Adapters/repositories:

```text
infrastructure details
```

This is a very common architecture.

---

# 32. Facade over legacy code

Suppose an old system requires:

```java
legacy.initialize();

legacy.loadSession();

legacy.validateCode();

legacy.executeCommand();

legacy.flush();

legacy.closeSession();
```

You don't want every new feature team to learn that sequence.

Create:

```java
class LegacySystemFacade {

    private final LegacySystem legacy;

    public Result execute(
            Request request) {

        legacy.initialize();
        legacy.loadSession();

        legacy.validateCode(
            request.getCode()
        );

        Result result =
                legacy.executeCommand();

        legacy.flush();
        legacy.closeSession();

        return result;
    }
}
```

Now modern code uses:

```java
legacyFacade.execute(request);
```

That can be extremely valuable during migrations.

---

# 33. Facade as knowledge containment

One of the deeper benefits is that the facade becomes the place that knows:

```text
which subsystem objects exist
how they are configured
which order operations occur
which dependencies must work together
```

That knowledge isn't spread throughout the system.

This is a powerful design principle:

> Keep knowledge of complexity close to the complexity.

Don't make every client understand subsystem internals.

---

# 34. Facade vs encapsulation

Facade often improves encapsulation, but it isn't exactly the same thing.

Encapsulation:

> Hide internal state and implementation details.

Facade:

> Offer a simpler interface over a complex subsystem.

Facade frequently uses encapsulation, but its specific intent is usability and reduced coupling.

---

# 35. A small Java example

Suppose we have:

```java
class CPU {

    void freeze() {
        System.out.println("CPU freeze");
    }

    void execute() {
        System.out.println("CPU execute");
    }
}
```

```java
class Memory {

    void load() {
        System.out.println("Memory loaded");
    }
}
```

```java
class HardDrive {

    void read() {
        System.out.println("Hard drive read");
    }
}
```

Without a facade:

```java
cpu.freeze();
hardDrive.read();
memory.load();
cpu.execute();
```

Facade:

```java
class ComputerFacade {

    private final CPU cpu;
    private final Memory memory;
    private final HardDrive hardDrive;

    public ComputerFacade(
            CPU cpu,
            Memory memory,
            HardDrive hardDrive) {

        this.cpu = cpu;
        this.memory = memory;
        this.hardDrive = hardDrive;
    }

    public void start() {

        cpu.freeze();
        hardDrive.read();
        memory.load();
        cpu.execute();
    }
}
```

Now:

```java
computerFacade.start();
```

The caller doesn't care about the startup sequence.

---

# 36. Recognition clues

Facade is a strong candidate when you find yourself saying:

```text
"Every caller needs to coordinate the same
five services."

"The subsystem API is too complicated."

"Clients know too much about internal sequencing."

"We need one simple entry point."

"We want to hide legacy-system complexity."

"Controllers are orchestrating too much."
```

The recognition question is:

> **Does the client really need to understand all of this subsystem complexity?**

If not, a facade may help.

---

# 37. Common mistakes

One mistake is putting the actual domain logic inside the facade when it belongs in domain classes.

For example:

```java
class CheckoutFacade {

    void placeOrder(Order order) {

        if (customer.getAge() > 65
                && product.isSpecialCategory()
                && order.getTotal() > 1000) {

            // huge complex business rule
        }
    }
}
```

Sometimes some business logic naturally belongs at the use-case level, but rich domain rules often deserve dedicated domain objects/services.

Another mistake is creating a facade that simply forwards dozens of methods one-to-one:

```java
facade.methodA();
facade.methodB();
facade.methodC();
```

If the facade doesn't simplify anything or create a meaningful boundary, it may not be adding value.

---

# 38. Interview answer

If asked:

> What is the Facade Pattern?

A strong answer is:

> Facade is a structural design pattern that provides a simplified, higher-level interface to a complex subsystem. It reduces coupling by allowing clients to depend on one entry point instead of coordinating many subsystem classes directly.

Then give the checkout example:

> Instead of a controller calling inventory, fraud, payment, shipping, invoice, and notification services individually, a `CheckoutFacade.placeOrder()` method can coordinate those operations internally.

That's a strong answer.

---

# 39. Pattern comparison

A compact way to distinguish the structural patterns we've covered is:

```text
Adapter
→ "This interface doesn't fit."

Decorator
→ "I want to add behavior."

Facade
→ "This subsystem is too complicated."
```

Those three can look structurally similar because they all wrap or sit in front of other objects.

What distinguishes patterns is often not the class diagram.

It's the **intent**.

That's a very important design-pattern lesson.

---

# 40. The deeper lesson

Facade teaches us:

> Clients should depend on the level of abstraction appropriate to their job.

A controller shouldn't need to understand payment-gateway retries.

A UI shouldn't need to understand database transactions.

A customer-facing API shouldn't need to understand seven internal subsystems.

Give each client the simplest meaningful interface it needs.

That's closely related to ISP and DIP.

---

# What we've covered

We now know three structural patterns:

```text
Adapter
→ Make incompatible interfaces compatible.

Decorator
→ Add behavior dynamically while preserving
  the same interface.

Facade
→ Provide a simple entry point to a complex
  subsystem.
```

A useful way to remember them is:

```text
Adapter   = translate
Decorator = wrap and enhance
Facade    = simplify
```

# Next: Lesson 15 — Composite Pattern

Composite solves a very different problem.

Imagine a file system:

```text
File

Folder
 ├── File
 ├── File
 └── Folder
      ├── File
      └── File
```

A folder contains files **and other folders**.

Now you want to do:

```java
node.getSize();
```

and have it work whether `node` is:

```text
a single file
```

or:

```text
an entire folder tree
```

The **Composite Pattern** lets us treat individual objects and groups of objects through the same abstraction.

We'll use file systems, menus, organization charts, UI trees, and product bundles to understand why recursive object structures are so useful.
