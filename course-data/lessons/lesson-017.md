# Lesson 17 — Bridge Pattern

The **Bridge Pattern** is used when a system has **two independent dimensions that can vary**, and inheritance would create too many subclasses.

The core idea is:

> Separate an abstraction from its implementation so both can evolve independently.

A simpler way to think about it:

> When you have two things changing independently, connect them with composition instead of multiplying subclasses.

---

# 1. The problem

Suppose we're building shapes:

```text
Circle
Square
Triangle
```

And each shape can be rendered using:

```text
Vector
Raster
3D
```

A naive inheritance design might become:

```text
VectorCircle
RasterCircle
ThreeDCircle

VectorSquare
RasterSquare
ThreeDSquare

VectorTriangle
RasterTriangle
ThreeDTriangle
```

We now have:

```text
3 shapes × 3 renderers = 9 classes
```

Add another shape:

```text
Rectangle
```

Now:

```text
4 × 3 = 12 classes
```

Add another renderer:

```text
SVG
```

Now:

```text
4 × 4 = 16 classes
```

This gets worse as both dimensions grow.

---

# 2. The real issue

We have two independent axes of variation:

```text
Axis 1:
Shape type

Circle
Square
Triangle
```

and:

```text
Axis 2:
Rendering mechanism

Vector
Raster
3D
```

Inheritance is trying to encode both dimensions in the same hierarchy.

That's the problem.

---

# 3. Bridge separates the dimensions

Instead of:

```text
VectorCircle
RasterCircle
VectorSquare
RasterSquare
```

we create:

```text
Shape
  |
  v
Renderer
```

A `Shape` contains a `Renderer`.

Then we can combine them dynamically:

```text
Circle + VectorRenderer

Circle + RasterRenderer

Square + VectorRenderer

Square + RasterRenderer
```

without creating a special class for every combination.

---

# 4. Start with the implementation abstraction

Let's define:

```java
interface Renderer {

    void renderCircle(double radius);

    void renderSquare(double side);
}
```

One implementation:

```java
class VectorRenderer
        implements Renderer {

    @Override
    public void renderCircle(
            double radius) {

        System.out.println(
            "Drawing vector circle "
            + "with radius "
            + radius
        );
    }

    @Override
    public void renderSquare(
            double side) {

        System.out.println(
            "Drawing vector square "
            + "with side "
            + side
        );
    }
}
```

Another:

```java
class RasterRenderer
        implements Renderer {

    @Override
    public void renderCircle(
            double radius) {

        System.out.println(
            "Drawing raster circle "
            + "with radius "
            + radius
        );
    }

    @Override
    public void renderSquare(
            double side) {

        System.out.println(
            "Drawing raster square "
            + "with side "
            + side
        );
    }
}
```

---

# 5. Create the abstraction side

Now:

```java
abstract class Shape {

    protected final Renderer renderer;

    public Shape(Renderer renderer) {
        this.renderer = renderer;
    }

    public abstract void draw();
}
```

Notice:

```java
Shape
```

does not know:

```text
VectorRenderer
RasterRenderer
```

It only knows:

```java
Renderer
```

That's the bridge.

---

# 6. Concrete abstractions

Circle:

```java
class Circle extends Shape {

    private final double radius;

    public Circle(
            double radius,
            Renderer renderer) {

        super(renderer);

        this.radius = radius;
    }

    @Override
    public void draw() {

        renderer.renderCircle(
            radius
        );
    }
}
```

Square:

```java
class Square extends Shape {

    private final double side;

    public Square(
            double side,
            Renderer renderer) {

        super(renderer);

        this.side = side;
    }

    @Override
    public void draw() {

        renderer.renderSquare(
            side
        );
    }
}
```

---

# 7. Usage

Vector circle:

```java
Shape circle =
        new Circle(
            10,
            new VectorRenderer()
        );

circle.draw();
```

Raster circle:

```java
Shape circle =
        new Circle(
            10,
            new RasterRenderer()
        );

circle.draw();
```

Vector square:

```java
Shape square =
        new Square(
            5,
            new VectorRenderer()
        );

square.draw();
```

Same `Circle` class.

Same `Square` class.

Different rendering implementations.

---

# 8. Structure

Conceptually:

```text
          Shape
         /     \
        /       \
    Circle     Square
       |
       |
       v
    Renderer
     /     \
    /       \
 Vector    Raster
```

More precisely:

```text
Abstraction
   Shape
     |
     | has-a
     v
Implementation
   Renderer
```

Then both sides can have their own hierarchies.

---

# 9. Why it's called a Bridge

Because:

```java
protected final Renderer renderer;
```

acts as a bridge between:

```text
shape abstraction
```

and:

```text
rendering implementation
```

The `Shape` hierarchy doesn't directly inherit rendering behavior.

Instead, it delegates to a renderer.

The two sides are connected through composition.

---

# 10. Classic Bridge terminology

There are usually four roles.

### Abstraction

The high-level side:

```java
Shape
```

### Refined Abstraction

Concrete variations:

```text
Circle
Square
Triangle
```

### Implementor

The implementation abstraction:

```java
Renderer
```

### Concrete Implementors

```text
VectorRenderer
RasterRenderer
ThreeDRenderer
```

So:

```text
Abstraction
    ↓
Shape

Refined Abstractions
    ↓
Circle
Square

Implementor
    ↓
Renderer

Concrete Implementors
    ↓
VectorRenderer
RasterRenderer
```

---

# 11. Why composition is better here

Without Bridge:

```text
VectorCircle
RasterCircle
VectorSquare
RasterSquare
```

With Bridge:

```text
Circle
Square

+

VectorRenderer
RasterRenderer
```

Class count becomes closer to:

```text
number of abstractions
+
number of implementations
```

instead of:

```text
number of abstractions
×
number of implementations
```

That's the major structural advantage.

---

# 12. Add another renderer

Suppose we add:

```java
class ThreeDRenderer
        implements Renderer {

    @Override
    public void renderCircle(
            double radius) {

        System.out.println(
            "Rendering 3D circle"
        );
    }

    @Override
    public void renderSquare(
            double side) {

        System.out.println(
            "Rendering 3D square"
        );
    }
}
```

Now:

```java
Shape circle =
        new Circle(
            10,
            new ThreeDRenderer()
        );
```

What changed inside `Circle`?

Nothing.

What changed inside `Square`?

Nothing.

The implementation side evolved independently.

---

# 13. Add another shape

Suppose:

```java
class Triangle extends Shape {

    private final double base;
    private final double height;

    public Triangle(
            double base,
            double height,
            Renderer renderer) {

        super(renderer);

        this.base = base;
        this.height = height;
    }

    @Override
    public void draw() {

        System.out.println(
            "Triangle uses renderer"
        );
    }
}
```

The abstraction hierarchy can also grow independently.

This is the whole point:

> Both dimensions can evolve without multiplying combinations.

---

# 14. Better renderer design

You may notice a weakness in:

```java
interface Renderer {

    void renderCircle(...);

    void renderSquare(...);
}
```

Every time we add a new shape, the renderer interface must change.

That can create OCP/ISP issues.

A more flexible design may use generic primitives.

For example:

```java
interface Renderer {

    void drawLine(
            double x1,
            double y1,
            double x2,
            double y2
    );

    void drawCircle(
            double x,
            double y,
            double radius
    );
}
```

Then shapes combine lower-level rendering operations.

The exact bridge interface depends on the domain.

This is an important lesson:

> The pattern doesn't remove the need for good abstraction design.

---

# 15. A more practical example — notifications

Suppose we have notification types:

```text
AlertNotification
ReminderNotification
MarketingNotification
```

And delivery channels:

```text
Email
SMS
Push
```

Inheritance could lead to:

```text
EmailAlertNotification
SmsAlertNotification
PushAlertNotification

EmailReminderNotification
SmsReminderNotification
PushReminderNotification

EmailMarketingNotification
SmsMarketingNotification
PushMarketingNotification
```

Again:

```text
notification type × delivery channel
```

class explosion.

Bridge can separate them.

---

# 16. Notification bridge

Implementation side:

```java
interface MessageSender {

    void send(
        String recipient,
        String message
    );
}
```

Email:

```java
class EmailSender
        implements MessageSender {

    @Override
    public void send(
            String recipient,
            String message) {

        System.out.println(
            "Email to "
            + recipient
            + ": "
            + message
        );
    }
}
```

SMS:

```java
class SmsSender
        implements MessageSender {

    @Override
    public void send(
            String recipient,
            String message) {

        System.out.println(
            "SMS to "
            + recipient
            + ": "
            + message
        );
    }
}
```

---

# 17. Notification abstraction

```java
abstract class Notification {

    protected final MessageSender sender;

    protected Notification(
            MessageSender sender) {

        this.sender = sender;
    }

    public abstract void notify(
            String recipient);
}
```

Alert:

```java
class AlertNotification
        extends Notification {

    private final String alert;

    public AlertNotification(
            String alert,
            MessageSender sender) {

        super(sender);

        this.alert = alert;
    }

    @Override
    public void notify(
            String recipient) {

        sender.send(
            recipient,
            "ALERT: " + alert
        );
    }
}
```

Reminder:

```java
class ReminderNotification
        extends Notification {

    private final String reminder;

    public ReminderNotification(
            String reminder,
            MessageSender sender) {

        super(sender);

        this.reminder = reminder;
    }

    @Override
    public void notify(
            String recipient) {

        sender.send(
            recipient,
            "REMINDER: " + reminder
        );
    }
}
```

---

# 18. Mix and match

Email alert:

```java
Notification notification =
        new AlertNotification(
            "Server down",
            new EmailSender()
        );
```

SMS alert:

```java
Notification notification =
        new AlertNotification(
            "Server down",
            new SmsSender()
        );
```

Email reminder:

```java
Notification notification =
        new ReminderNotification(
            "Meeting at 3 PM",
            new EmailSender()
        );
```

We didn't need:

```text
EmailAlertNotification
SmsAlertNotification
EmailReminderNotification
SmsReminderNotification
```

Bridge removed the cross-product.

---

# 19. Remote control example

This is another classic Bridge example.

Suppose we have devices:

```text
TV
Radio
Speaker
```

and remote controls:

```text
BasicRemote
AdvancedRemote
VoiceRemote
```

Without Bridge:

```text
BasicTvRemote
AdvancedTvRemote
VoiceTvRemote

BasicRadioRemote
AdvancedRadioRemote
VoiceRadioRemote
```

Again, explosion.

Instead:

```java
interface Device {

    void turnOn();

    void turnOff();

    void setVolume(int volume);

    boolean isEnabled();
}
```

TV:

```java
class Tv implements Device {

    private boolean enabled;
    private int volume;

    public void turnOn() {
        enabled = true;
    }

    public void turnOff() {
        enabled = false;
    }

    public void setVolume(
            int volume) {

        this.volume = volume;
    }

    public boolean isEnabled() {
        return enabled;
    }
}
```

---

# 20. Remote abstraction

```java
class BasicRemote {

    protected final Device device;

    public BasicRemote(
            Device device) {

        this.device = device;
    }

    public void power() {

        if (device.isEnabled()) {
            device.turnOff();
        } else {
            device.turnOn();
        }
    }
}
```

Advanced remote:

```java
class AdvancedRemote
        extends BasicRemote {

    public AdvancedRemote(
            Device device) {

        super(device);
    }

    public void mute() {

        device.setVolume(0);
    }
}
```

Now:

```java
BasicRemote tvRemote =
        new BasicRemote(
            new Tv()
        );
```

or:

```java
AdvancedRemote radioRemote =
        new AdvancedRemote(
            new Radio()
        );
```

Remote-control types and device types vary independently.

Beautiful Bridge example.

---

# 21. Why this isn't Strategy

Bridge and Strategy can look similar because both often contain an interface.

Strategy:

```java
class Context {

    private Strategy strategy;
}
```

Bridge:

```java
abstract class Abstraction {

    protected Implementor implementation;
}
```

Structurally similar.

The difference is intention.

Strategy:

> Swap an algorithm/behavior.

Bridge:

> Separate two independently varying class dimensions.

A useful memory rule:

```text
Strategy
→ one object delegates a behavior

Bridge
→ two hierarchies evolve independently
```

---

# 22. Example comparison

Strategy:

```text
CheckoutService
    |
    v
DiscountStrategy
```

The changing thing is:

```text
discount algorithm
```

Bridge:

```text
Notification Type
    |
    v
Delivery Channel
```

Both dimensions may grow independently.

That's the difference.

---

# 23. Bridge vs Adapter

This comparison is important.

Adapter usually comes **after** incompatible classes already exist.

You have:

```text
Existing API A
Existing API B
```

and need to connect them.

Bridge is usually designed **up front** because you know two dimensions will vary.

So:

```text
Adapter
→ make existing things compatible

Bridge
→ intentionally separate future variation
```

A useful phrase:

> Adapter repairs incompatibility. Bridge prevents inheritance explosion.

---

# 24. Bridge vs Decorator

Decorator:

> Add behavior by wrapping an object of the same abstraction.

Bridge:

> Connect two different abstraction hierarchies.

Decorator:

```text
Service
  ↓
LoggingService
  ↓
RealService
```

Bridge:

```text
Remote
  ↓
Device
```

The wrapped types are conceptually different roles.

---

# 25. Bridge vs Abstract Factory

Abstract Factory:

> Create families of related products.

Bridge:

> Keep two variation dimensions independent.

They can work together.

For example, a factory could create the correct renderer:

```java
Renderer renderer =
        rendererFactory.create();
```

Then:

```java
Shape shape =
        new Circle(
            10,
            renderer
        );
```

Patterns can compose naturally.

---

# 26. Bridge vs composition in general

Not every use of composition is Bridge.

For example:

```java
class Car {

    private Engine engine;
}
```

is composition.

But it's not necessarily Bridge.

For Bridge, we typically want:

```text
Abstraction hierarchy
+
Implementation hierarchy
```

with both expected to vary independently.

That's the key recognition signal.

---

# 27. Another example — reports

Suppose we have report types:

```text
SalesReport
InventoryReport
FinanceReport
```

and output formats:

```text
PDF
HTML
CSV
```

Inheritance gives:

```text
PdfSalesReport
HtmlSalesReport
CsvSalesReport

PdfInventoryReport
HtmlInventoryReport
CsvInventoryReport
```

Bridge separates:

```java
interface ReportFormatter {

    String format(
        ReportData data
    );
}
```

Implementations:

```text
PdfFormatter
HtmlFormatter
CsvFormatter
```

Then:

```java
abstract class Report {

    protected final ReportFormatter formatter;

    protected Report(
            ReportFormatter formatter) {

        this.formatter = formatter;
    }

    public abstract String generate();
}
```

Now:

```text
SalesReport + PdfFormatter
SalesReport + CsvFormatter
InventoryReport + HtmlFormatter
```

can be combined freely.

---

# 28. Another example — database + persistence model

Suppose you have:

```text
UserRepository
OrderRepository
ProductRepository
```

and:

```text
MySQL
PostgreSQL
MongoDB
```

If you model this through inheritance alone:

```text
MySqlUserRepository
PostgresUserRepository
MongoUserRepository

MySqlOrderRepository
PostgresOrderRepository
MongoOrderRepository
```

sometimes this may be perfectly fine.

But if the repository abstraction and storage engine both have rich independent hierarchies, Bridge can become useful.

For example:

```java
interface StorageEngine {

    void save(
        String table,
        Object data
    );
}
```

Then repositories compose with storage engines.

But be careful: don't force Bridge where simple repository implementations are clearer.

Patterns should solve real complexity.

---

# 29. Bridge and OCP

Suppose we add:

```java
class SvgRenderer
        implements Renderer {
}
```

Existing shapes don't change.

Or add:

```java
class Hexagon
        extends Shape {
}
```

Existing renderers may not need to change if the implementor abstraction is general enough.

So Bridge can support OCP on both dimensions.

That's one of its strongest benefits.

---

# 30. Bridge and DIP

The abstraction side depends on:

```java
Renderer
```

not:

```java
VectorRenderer
```

So high-level shape logic depends on an abstraction.

That's DIP.

---

# 31. Bridge and composition over inheritance

Without Bridge:

```text
VectorCircle
RasterCircle
VectorSquare
RasterSquare
```

With Bridge:

```java
new Circle(
    new VectorRenderer()
);
```

We replaced combinatorial inheritance with composition.

That's exactly the principle:

> Favor composition over inheritance.

---

# 32. Runtime switching

Because implementation is composed, you can sometimes switch it dynamically.

Suppose:

```java
class Shape {

    protected Renderer renderer;

    public void setRenderer(
            Renderer renderer) {

        this.renderer = renderer;
    }
}
```

Then:

```java
shape.setRenderer(
    new VectorRenderer()
);
```

later:

```java
shape.setRenderer(
    new RasterRenderer()
);
```

The abstraction changes its implementation strategy at runtime.

This flexibility is harder with inheritance.

---

# 33. But immutable composition is often cleaner

You don't always need:

```java
setRenderer(...)
```

You can keep:

```java
private final Renderer renderer;
```

and configure it once in the constructor.

That is often easier to reason about.

Runtime replacement is an option, not a requirement of Bridge.

---

# 34. Common mistake: one dimension doesn't really vary

Suppose you have:

```text
Circle
Square
```

and exactly one renderer forever.

Creating a full Bridge abstraction might be unnecessary.

Bridge adds:

```text
extra interface
extra delegation
extra conceptual layer
```

Use it when independent variation is real or reasonably expected.

---

# 35. Common mistake: leaky implementation interface

Suppose:

```java
interface Renderer {

    void callDirectXSpecificMethod();

    void useWindowsHandle();
}
```

Now `Shape` becomes coupled to platform-specific details.

The implementor abstraction should describe what the abstraction needs, not expose unnecessary concrete technology details.

This is similar to DIP reasoning from Lesson 6.

---

# 36. Common mistake: too many tiny abstractions

Don't transform:

```java
class Button {

    void render();
}
```

into five abstraction layers just because Bridge exists.

The pattern is valuable when there are genuinely independent hierarchies.

Otherwise, simple composition may be enough.

---

# 37. Recognition clues

Think Bridge when requirements sound like:

```text
"We have several types of X,
and several implementations of Y."

"Both dimensions keep growing."

"Subclass combinations are exploding."

"We need to mix and match two hierarchies."

"We want platform and feature type
to vary independently."

"We want abstraction and implementation
to evolve separately."
```

The strongest clue is:

> **Two independent dimensions are being multiplied together through inheritance.**

---

# 38. Interview answer

If an interviewer asks:

> What is the Bridge Pattern?

A strong answer is:

> Bridge is a structural design pattern that separates an abstraction from its implementation so both can vary independently. It replaces inheritance across two variation dimensions with composition. For example, `Shape` can contain a `Renderer`, allowing `Circle` and `Square` to work with `VectorRenderer`, `RasterRenderer`, or other renderers without creating a subclass for every combination.

That's a strong answer.

---

# 39. Interview comparison: Bridge vs Adapter

A good answer:

> Bridge is usually designed proactively to separate two dimensions of variation, whereas Adapter is usually introduced to make existing incompatible interfaces work together.

Very useful distinction.

---

# 40. Interview comparison: Bridge vs Strategy

A good answer:

> Both use composition, but Strategy focuses on swapping an algorithm or behavior, while Bridge separates two class hierarchies that are expected to evolve independently.

---

# 41. Mental model

Remember:

```text
Abstraction hierarchy
        |
        | has-a
        v
Implementation hierarchy
```

For example:

```text
Notification
├── Alert
└── Reminder

        |
        v

MessageSender
├── Email
├── SMS
└── Push
```

Then combinations happen through composition:

```text
Alert + Email
Alert + SMS
Reminder + Push
```

instead of subclass multiplication.

---

# Structural patterns so far

We now know:

```text
Adapter
→ Make incompatible interfaces work together.

Decorator
→ Add behavior dynamically.

Facade
→ Simplify a complex subsystem.

Composite
→ Treat individual objects and groups uniformly.

Proxy
→ Control access to another object.

Bridge
→ Separate two independent dimensions of variation.
```

A compact memory model:

```text
Adapter   = translate
Decorator = enhance
Facade    = simplify
Composite = tree
Proxy     = control
Bridge    = separate dimensions
```

# Next: Lesson 18 — Flyweight Pattern

Flyweight solves a completely different structural problem:

> What if your application needs millions of similar objects?

Imagine a game with one million trees.

Bad design:

```java
class Tree {

    String species;
    String texture;
    String model;
    String color;

    int x;
    int y;
}
```

If every tree stores the same large texture/model data separately, memory usage explodes.

Flyweight separates:

```text
Shared intrinsic state
→ species
→ model
→ texture

Unique extrinsic state
→ x
→ y
```

so thousands or millions of objects can share the heavy common data.

That's **Lesson 18 — Flyweight Pattern**, the final classic structural pattern.
