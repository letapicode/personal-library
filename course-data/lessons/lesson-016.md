# Lesson 16 — Proxy Pattern

The **Proxy Pattern** is used when you want an object to stand in front of another object and **control access** to it.

The proxy exposes the same interface as the real object, so the client usually doesn't need to know whether it is talking to:

```text
the real object
```

or:

```text
a proxy for the real object
```

The core idea is:

> Put a controlled representative in front of another object.

---

# 1. Start with the problem

Imagine an image viewer.

We define:

```java
interface Image {

    void display();
}
```

A real image:

```java
class RealImage implements Image {

    private final String filename;

    public RealImage(String filename) {
        this.filename = filename;
        loadFromDisk();
    }

    private void loadFromDisk() {
        System.out.println(
            "Loading " + filename
        );
    }

    @Override
    public void display() {
        System.out.println(
            "Displaying " + filename
        );
    }
}
```

Now:

```java
Image image =
        new RealImage(
            "huge-photo.jpg"
        );
```

immediately executes:

```text
Loading huge-photo.jpg
```

But what if the user never actually views the image?

We paid the expensive loading cost for nothing.

---

# 2. Enter Proxy

Instead of creating the real image immediately, create a proxy:

```java
class ImageProxy implements Image {

    private final String filename;
    private RealImage realImage;

    public ImageProxy(String filename) {
        this.filename = filename;
    }

    @Override
    public void display() {

        if (realImage == null) {

            realImage =
                    new RealImage(
                        filename
                    );
        }

        realImage.display();
    }
}
```

Now:

```java
Image image =
        new ImageProxy(
            "huge-photo.jpg"
        );
```

Nothing expensive happens yet.

Only when:

```java
image.display();
```

is called does the proxy create:

```java
RealImage
```

and load the image.

This is called a:

> **Virtual Proxy**

---

# 3. Structure

Conceptually:

```text
Client
  |
  v
Image
  ^
  |
ImageProxy
  |
  v
RealImage
```

Both:

```text
ImageProxy
RealImage
```

implement:

```java
Image
```

So the client can treat them identically.

---

# 4. The roles

Proxy usually has three important participants.

### Subject

The common interface:

```java
interface Image {

    void display();
}
```

### Real Subject

The actual object:

```java
class RealImage
        implements Image {
}
```

### Proxy

Controls access to the real object:

```java
class ImageProxy
        implements Image {
}
```

Structure:

```text
        Subject
        /     \
       /       \
    Proxy    RealSubject
      |
      v
 RealSubject
```

---

# 5. Why not just put lazy loading inside `RealImage`?

Good question.

You could.

But then `RealImage` becomes responsible for both:

```text
image behavior
lazy lifecycle management
```

With Proxy:

```text
RealImage
→ does real image work

ImageProxy
→ controls when RealImage is created
```

That separation can be cleaner.

It also means we can add access-control behavior without modifying the real implementation.

---

# 6. Virtual Proxy

The first type of Proxy is:

> **Virtual Proxy**

Its purpose is to delay creation or loading of something expensive.

Examples:

```text
large images
video files
database entities
expensive reports
large documents
remote resources
```

Basic structure:

```java
public void operation() {

    if (realObject == null) {
        realObject =
                new RealObject();
    }

    realObject.operation();
}
```

This is lazy initialization wrapped behind the same abstraction.

---

# 7. Database lazy loading

Imagine:

```java
interface UserProfile {

    List<Order> getOrders();
}
```

Loading a user's order history might require a database query.

Maybe many callers only need:

```text
user.getName()
```

and never need the orders.

A proxy could delay loading:

```text
UserProxy
   |
   + name already loaded
   |
   + orders loaded only when
     getOrders() is called
```

ORM frameworks often use proxy-like techniques for lazy-loading relationships.

Conceptually:

```java
user.getOrders();
```

can trigger the database query only at that point.

---

# 8. Protection Proxy

Another type is:

> **Protection Proxy**

It checks whether the caller is allowed to access the real object.

Suppose:

```java
interface DocumentService {

    String readDocument(
        String documentId
    );
}
```

Real implementation:

```java
class RealDocumentService
        implements DocumentService {

    @Override
    public String readDocument(
            String documentId) {

        return "Sensitive document";
    }
}
```

We want authorization.

Proxy:

```java
class SecuredDocumentProxy
        implements DocumentService {

    private final DocumentService service;
    private final User user;

    public SecuredDocumentProxy(
            DocumentService service,
            User user) {

        this.service = service;
        this.user = user;
    }

    @Override
    public String readDocument(
            String documentId) {

        if (!user.hasPermission(
                "READ_DOCUMENT")) {

            throw new SecurityException(
                "Access denied"
            );
        }

        return service.readDocument(
            documentId
        );
    }
}
```

Now:

```text
Client
  ↓
Security Proxy
  ↓
Real Document Service
```

The proxy controls access.

---

# 9. Why is this different from Decorator?

Structurally, these two patterns can look almost identical.

Decorator:

```java
class LoggingService
        implements Service {

    private final Service service;
}
```

Proxy:

```java
class SecuredService
        implements Service {

    private final Service service;
}
```

So what's the difference?

> **Intent.**

Decorator:

> Add behavior/responsibility.

Proxy:

> Control access to another object.

That's the key.

---

# 10. Decorator vs Proxy

Consider Decorator:

```text
Logging
  ↓
Retry
  ↓
Actual Service
```

The goal is to enhance behavior.

Now Proxy:

```text
Client
  ↓
Authorization Proxy
  ↓
Actual Service
```

The goal is to decide:

> Should this call reach the real service?

Or:

> When should the real service be created?

Or:

> Should this result come from cache instead?

So:

```text
Decorator
→ enhance

Proxy
→ control
```

---

# 11. Caching Proxy

Suppose:

```java
interface ProductService {

    Product getProduct(long id);
}
```

Real implementation:

```java
class DatabaseProductService
        implements ProductService {

    @Override
    public Product getProduct(
            long id) {

        System.out.println(
            "Querying database"
        );

        return loadFromDatabase(id);
    }
}
```

Database queries are expensive.

A caching proxy:

```java
class CachedProductProxy
        implements ProductService {

    private final ProductService service;

    private final Map<Long, Product>
            cache =
            new HashMap<>();

    public CachedProductProxy(
            ProductService service) {

        this.service = service;
    }

    @Override
    public Product getProduct(
            long id) {

        if (cache.containsKey(id)) {
            return cache.get(id);
        }

        Product product =
                service.getProduct(id);

        cache.put(
            id,
            product
        );

        return product;
    }
}
```

First request:

```text
Database
```

Second request:

```text
Cache
```

The caller still sees:

```java
ProductService
```

---

# 12. Is caching always Proxy?

Caching can be implemented in many ways.

But when an object stands in front of another service with the same interface and decides whether the real service needs to be called, that is very proxy-like.

Conceptually:

```text
Client
   |
   v
Caching Proxy
   |
   | cache miss
   v
Real Service
```

---

# 13. Remote Proxy

Another important type:

> **Remote Proxy**

Suppose client code wants:

```java
interface WeatherService {

    Weather getWeather(
        String city
    );
}
```

But the actual service lives on another server.

The caller might use:

```java
Weather weather =
        service.getWeather(
            "Columbus"
        );
```

The proxy internally performs:

```text
serialize request
HTTP/RPC call
network communication
deserialize response
error translation
```

Conceptually:

```text
Client Process

WeatherService
      ^
      |
Remote Proxy
      |
      | network
      v

Remote Weather Service
```

From the caller's perspective, it still feels like a local method call.

That's a Remote Proxy.

---

# 14. Simplified remote example

```java
class RemoteWeatherProxy
        implements WeatherService {

    private final HttpClient client;

    public RemoteWeatherProxy(
            HttpClient client) {

        this.client = client;
    }

    @Override
    public Weather getWeather(
            String city) {

        String response =
                client.get(
                    "/weather?city="
                    + city
                );

        return parse(response);
    }
}
```

The client doesn't care about HTTP.

It interacts with:

```java
WeatherService
```

---

# 15. Proxy can hide location

That's a powerful concept.

The real object might be:

```text
in memory
on disk
in a database
on another machine
behind an API
```

The proxy can make access look uniform.

The client only sees:

```java
someService.operation();
```

This is sometimes called:

> **Location transparency**

although real distributed systems still have very different failure characteristics than local calls.

---

# 16. Logging Proxy

Suppose:

```java
interface PaymentService {

    void pay(double amount);
}
```

Real:

```java
class RealPaymentService
        implements PaymentService {

    public void pay(double amount) {

        System.out.println(
            "Processing payment"
        );
    }
}
```

Proxy:

```java
class LoggingPaymentProxy
        implements PaymentService {

    private final PaymentService service;

    public LoggingPaymentProxy(
            PaymentService service) {

        this.service = service;
    }

    @Override
    public void pay(double amount) {

        System.out.println(
            "Before payment"
        );

        service.pay(amount);

        System.out.println(
            "After payment"
        );
    }
}
```

But now you may ask:

> Isn't this Decorator?

Potentially yes.

That's where intent matters.

If logging is considered an added responsibility, we'd usually describe it as Decorator.

If the wrapper exists as an access/interception layer around service calls, it may be proxy-like.

Patterns can overlap structurally.

---

# 17. Same structure, different intention

This is one of the biggest lessons in design patterns.

You cannot always identify a pattern just from code like:

```java
class Wrapper implements Service {

    private Service service;
}
```

That could be:

```text
Decorator
Proxy
Adapter-like wrapper
```

You must ask:

> Why is this wrapper here?

If:

```text
add behavior
```

→ Decorator.

If:

```text
control access
```

→ Proxy.

If:

```text
translate interface
```

→ Adapter.

Intent matters more than shape.

---

# 18. Smart Proxy

A **Smart Proxy** performs additional bookkeeping when an object is accessed.

Examples:

```text
reference counting
lock acquisition
resource management
usage tracking
```

Suppose:

```java
class ResourceProxy
        implements Resource {

    private final Resource resource;

    public void use() {

        acquireLock();

        try {
            resource.use();
        } finally {
            releaseLock();
        }
    }
}
```

The proxy controls the conditions around access.

---

# 19. Rate-limiting Proxy

Suppose:

```java
interface ExternalApi {

    Response call(Request request);
}
```

Proxy:

```java
class RateLimitedApiProxy
        implements ExternalApi {

    private final ExternalApi api;

    private long lastCallTime;

    public RateLimitedApiProxy(
            ExternalApi api) {

        this.api = api;
    }

    @Override
    public Response call(
            Request request) {

        enforceRateLimit();

        return api.call(request);
    }

    private void enforceRateLimit() {
        // simplified
    }
}
```

The proxy determines when the real API may be accessed.

That's a natural Proxy use case.

---

# 20. Access-control example with files

Imagine:

```java
interface FileResource {

    String read();
}
```

Real:

```java
class RealFile
        implements FileResource {

    private final String path;

    public RealFile(String path) {
        this.path = path;
    }

    public String read() {
        return "contents";
    }
}
```

Proxy:

```java
class SecureFileProxy
        implements FileResource {

    private final FileResource file;
    private final User user;

    public SecureFileProxy(
            FileResource file,
            User user) {

        this.file = file;
        this.user = user;
    }

    @Override
    public String read() {

        if (!user.canRead()) {

            throw new SecurityException(
                "Permission denied"
            );
        }

        return file.read();
    }
}
```

Again:

```text
Client
  ↓
Secure Proxy
  ↓
Real File
```

---

# 21. Proxy can create the real object itself

Virtual proxy:

```java
class ImageProxy implements Image {

    private RealImage image;

    public void display() {

        if (image == null) {
            image =
                new RealImage(...);
        }

        image.display();
    }
}
```

The proxy owns creation.

But some proxies receive the real object:

```java
class SecurityProxy {

    private final Service service;

    SecurityProxy(Service service) {
        this.service = service;
    }
}
```

Both are valid.

The exact construction approach depends on the goal.

---

# 22. Proxy and Lazy Initialization

You may notice Virtual Proxy resembles lazy initialization.

Correct.

Lazy initialization is the underlying technique:

```java
if (object == null) {
    object =
        new ExpensiveObject();
}
```

Proxy turns that idea into a structural boundary:

```text
client
→ proxy
→ lazily created real object
```

So lazy loading is one use of Proxy.

---

# 23. Proxy and OCP

Suppose:

```java
PaymentService service =
        new RealPaymentService();
```

Then we can add:

```java
service =
        new SecurityProxy(service);
```

without changing `RealPaymentService`.

That supports extension around the object.

Depending on design, this can align with OCP.

---

# 24. Proxy and DIP

Client code:

```java
class CheckoutService {

    private final PaymentService payment;

    CheckoutService(
            PaymentService payment) {

        this.payment = payment;
    }
}
```

It doesn't know whether `payment` is:

```text
RealPaymentService
SecurityProxy
RemotePaymentProxy
CachingPaymentProxy
```

It depends only on the abstraction.

That's DIP.

---

# 25. Proxy and LSP

If the client expects:

```java
PaymentService
```

then the proxy should behave consistently with that contract.

A proxy shouldn't unexpectedly destroy the semantics of the underlying service.

For example, if:

```java
pay(amount)
```

is expected to process valid payments, a proxy shouldn't silently ignore them.

So LSP matters.

---

# 26. Proxy and SRP

Without Proxy, the real service might accumulate:

```text
business logic
authorization
caching
lazy loading
remote transport
logging
rate limiting
```

Proxy can isolate some of those access concerns.

For example:

```text
RealProductService
→ product business logic

CachedProductProxy
→ caching

AuthorizedProductProxy
→ permissions
```

That separation can improve SRP.

---

# 27. Multiple proxies can be chained

Suppose:

```java
Service service =
        new RealService();
```

Then:

```java
service =
        new CachingProxy(service);

service =
        new SecurityProxy(service);

service =
        new RateLimitProxy(service);
```

Structure:

```text
RateLimitProxy
      ↓
SecurityProxy
      ↓
CachingProxy
      ↓
RealService
```

This looks exactly like Decorator chaining.

Again, the distinction is mostly conceptual intent.

---

# 28. Order can matter here too

Consider:

```text
Security
  ↓
Cache
  ↓
Real Service
```

versus:

```text
Cache
  ↓
Security
  ↓
Real Service
```

The second arrangement could theoretically return cached sensitive data before performing authorization if implemented badly.

So wrapper order can matter.

This is true for both Proxy and Decorator chains.

---

# 29. Spring and proxies

Frameworks frequently use proxies.

For example, conceptually, Spring can wrap your service:

```java
@Service
class PaymentService {
}
```

with a proxy that adds framework behavior such as:

```text
transactions
security
method interception
AOP advice
```

Your application calls what appears to be:

```java
paymentService.pay();
```

but the call may actually flow:

```text
Client
   ↓
Spring Proxy
   ↓
transaction/security logic
   ↓
Real PaymentService
```

This is one reason understanding Proxy is useful when working with frameworks.

---

# 30. Transactional proxy example

Conceptually, a transaction proxy might do:

```java
public void pay() {

    transaction.begin();

    try {

        target.pay();

        transaction.commit();

    } catch (Exception e) {

        transaction.rollback();

        throw e;
    }
}
```

The real business method doesn't necessarily manage the transaction itself.

The proxy wraps access to it.

Frameworks often generate such proxies automatically.

---

# 31. Dynamic Proxy in Java

Java can create some proxies dynamically at runtime.

For interfaces, Java provides mechanisms around:

```java
java.lang.reflect.Proxy
```

Conceptually:

```java
PaymentService proxy =
        (PaymentService)
        Proxy.newProxyInstance(...);
```

The invocation handler intercepts method calls.

A simplified handler might look like:

```java
class LoggingHandler
        implements InvocationHandler {

    private final Object target;

    LoggingHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(
            Object proxy,
            Method method,
            Object[] args)
            throws Throwable {

        System.out.println(
            "Calling "
            + method.getName()
        );

        return method.invoke(
            target,
            args
        );
    }
}
```

This lets frameworks create proxies without manually writing a wrapper class for every service.

---

# 32. Static vs dynamic proxy

A manually written proxy:

```java
class PaymentServiceProxy
        implements PaymentService {
}
```

is often called a:

> Static Proxy

because the class is explicitly written.

A runtime-generated proxy uses reflection or bytecode generation.

That can be called:

> Dynamic Proxy

Frameworks use dynamic proxies heavily because manually writing hundreds of proxy classes would be impractical.

---

# 33. Proxy in ORM frameworks

Imagine:

```java
Order order =
        repository.findById(1);
```

The `customer` relationship may not be loaded yet.

Then:

```java
order.getCustomer();
```

can cause:

```text
database query
```

behind the scenes.

The returned object may be proxy-like rather than the fully loaded real object initially.

This supports lazy loading.

It also explains errors you may encounter when lazy entities are accessed outside the required persistence/session context.

Understanding Proxy helps make these framework behaviors less mysterious.

---

# 34. Remote proxy warning

A remote proxy can make:

```java
service.getCustomer();
```

look like a normal local method call.

But a remote call can involve:

```text
network failure
timeouts
latency
authentication
serialization
partial failures
retries
```

So although the interface may look local, don't forget the actual cost.

This is an important distributed-systems lesson:

> Location transparency is convenient, but local and remote calls are not operationally equivalent.

---

# 35. Proxy vs Adapter

Adapter:

```text
client expects interface A
existing object provides interface B
```

so Adapter translates B into A.

Proxy:

```text
client and real object already share
the same abstraction
```

but the proxy controls access.

So:

```text
Adapter
→ interface conversion

Proxy
→ access control
```

---

# 36. Proxy vs Facade

Facade:

> Simplifies a complex subsystem.

Proxy:

> Represents another object and controls access to it.

Facade may sit in front of:

```text
many objects
```

Proxy usually represents:

```text
one conceptual subject
```

Example:

```text
CheckoutFacade
→ payment + inventory + shipping
```

versus:

```text
PaymentProxy
→ RealPaymentService
```

---

# 37. Proxy vs Decorator

This is the most important comparison.

Both often:

```text
implement same interface
contain same interface
delegate calls
```

But:

```text
Decorator
→ add responsibilities

Proxy
→ control access
```

Examples:

```text
Decorator:
CompressionStream
LoggingService
EncryptedDataSource
```

```text
Proxy:
LazyImage
SecuredService
RemoteService
CachedRepository
```

Again, intent determines the pattern.

---

# 38. Proxy vs Facade vs Adapter vs Decorator

A useful mental map:

```text
Adapter
→ "It doesn't fit."

Decorator
→ "I want more behavior."

Facade
→ "It's too complicated."

Proxy
→ "I need controlled access."
```

That's a very useful interview memory aid.

---

# 39. Example: expensive report

Suppose:

```java
interface Report {

    void display();
}
```

Real report:

```java
class HeavyReport
        implements Report {

    public HeavyReport() {
        generateReport();
    }

    private void generateReport() {

        System.out.println(
            "Generating huge report..."
        );
    }

    @Override
    public void display() {

        System.out.println(
            "Displaying report"
        );
    }
}
```

Proxy:

```java
class ReportProxy
        implements Report {

    private HeavyReport report;

    @Override
    public void display() {

        if (report == null) {

            report =
                new HeavyReport();
        }

        report.display();
    }
}
```

If nobody displays the report, it is never generated.

Classic Virtual Proxy.

---

# 40. Example: service authorization

```java
interface AdminService {

    void deleteUser(long userId);
}
```

Real:

```java
class RealAdminService
        implements AdminService {

    @Override
    public void deleteUser(
            long userId) {

        System.out.println(
            "Deleting user "
            + userId
        );
    }
}
```

Proxy:

```java
class AdminServiceProxy
        implements AdminService {

    private final AdminService service;
    private final User currentUser;

    public AdminServiceProxy(
            AdminService service,
            User currentUser) {

        this.service = service;
        this.currentUser =
                currentUser;
    }

    @Override
    public void deleteUser(
            long userId) {

        if (!currentUser.isAdmin()) {

            throw new SecurityException(
                "Admin access required"
            );
        }

        service.deleteUser(userId);
    }
}
```

The real service doesn't need to understand the current caller identity.

The proxy controls access.

---

# 41. Common mistake: putting core business rules in a proxy

Suppose:

```java
class PaymentProxy {

    void pay(Order order) {

        calculateDiscount();
        calculateTax();
        applyLoyaltyPoints();

        service.pay(order);
    }
}
```

Those sound like domain/business rules.

A proxy should usually focus on access concerns such as:

```text
security
caching
remote transport
lazy loading
rate limiting
```

Don't turn every wrapper into a random business-logic container.

---

# 42. Common mistake: misleading cache semantics

Suppose the real service returns frequently changing stock prices.

A caching proxy stores them forever.

Then the proxy technically works, but violates the expected freshness contract.

This is an LSP-style problem.

The proxy must preserve the meaningful semantics of the underlying abstraction.

---

# 43. Common mistake: swallowing exceptions

Bad:

```java
try {
    service.operation();
} catch (Exception e) {
    return null;
}
```

If the original abstraction expects failures to be visible, the proxy shouldn't silently change behavior unless that is intentionally part of the contract.

A proxy is not permission to arbitrarily change semantics.

---

# 44. Common mistake: unnecessary proxy

Don't create:

```java
UserServiceProxy
```

that only does:

```java
return service.getUser(id);
```

with no reason.

If there is no access-control, lifecycle, remote, caching, or interception concern, the extra layer may be useless.

Patterns should solve actual problems.

---

# 45. Recognition clues

Think Proxy when requirements say:

```text
"Don't create the expensive object until needed."

"Check permissions before allowing access."

"Cache the real service results."

"Represent a remote object locally."

"Rate-limit calls."

"Intercept method calls."

"Add transaction/security behavior
around service access."

"Hide whether the real object is local,
remote, or not yet loaded."
```

The recognition question is:

> **Do I need an object that stands in for another object and controls how or when it is accessed?**

If yes, Proxy is a strong candidate.

---

# 46. Interview answer

If asked:

> What is the Proxy Pattern?

A strong answer is:

> Proxy is a structural design pattern where a surrogate object implements the same interface as a real object and controls access to it. A proxy can provide lazy initialization, authorization, caching, remote communication, rate limiting, or other access-related behavior while keeping the client coupled only to the common abstraction.

Then give the image example:

> An `ImageProxy` can implement `Image`, hold the filename, and create `RealImage` only when `display()` is first called.

---

# 47. Proxy types to remember

The most useful ones are:

```text
Virtual Proxy
→ lazy initialization

Protection Proxy
→ authorization/access control

Remote Proxy
→ represents remote object

Caching Proxy
→ caches expensive results

Smart Proxy
→ bookkeeping/resource control
```

Don't obsess over memorizing every subtype name.

Understand the access problem they solve.

---

# 48. Mental model

Remember:

```text
Client
   |
   v
Subject Interface
   ^
   |
 Proxy
   |
   | controls
   v
Real Subject
```

The most important word is:

> **controls**

That separates Proxy from many other wrappers.

---

# Structural patterns so far

We now know:

```text
Adapter
→ Make incompatible interfaces work together.

Decorator
→ Add behavior through wrapping.

Facade
→ Simplify a complex subsystem.

Composite
→ Treat individual objects and groups uniformly.

Proxy
→ Control access to another object.
```

A compact memory model:

```text
Adapter   = translate
Decorator = enhance
Facade    = simplify
Composite = tree
Proxy     = control
```

# Next: Lesson 17 — Bridge Pattern

Bridge addresses a very different structural problem.

Imagine you have two independent dimensions:

```text
Shape:
Circle
Square
Triangle
```

and:

```text
Rendering:
Vector
Raster
3D
```

Inheritance can create:

```text
VectorCircle
RasterCircle
3DCircle

VectorSquare
RasterSquare
3DSquare

VectorTriangle
RasterTriangle
3DTriangle
```

Now both dimensions keep growing, and the number of subclasses explodes.

**Bridge** separates them:

```text
Shape
  |
  v
Renderer
```

so:

```text
Circle + VectorRenderer
Circle + RasterRenderer
Square + VectorRenderer
Square + RasterRenderer
```

can be composed independently.

That's **Lesson 17 — Bridge Pattern**, where we'll learn how to separate two axes of variation instead of multiplying inheritance hierarchies.
