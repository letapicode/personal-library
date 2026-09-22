# Lesson 9 — Builder Pattern

The **Builder Pattern** is used when creating an object becomes complicated because it has many fields, optional parameters, validation rules, or construction steps.

The core idea is:

> Construct a complex object step by step instead of forcing everything into one huge constructor.

---

# 1. The problem: telescoping constructors

Suppose we have:

```java
class Computer {

    private String cpu;
    private int ram;
    private int storage;
    private boolean wifi;
    private boolean bluetooth;
    private String gpu;
    private String operatingSystem;
}
```

We could write a constructor:

```java
public Computer(
        String cpu,
        int ram,
        int storage,
        boolean wifi,
        boolean bluetooth,
        String gpu,
        String operatingSystem) {

    this.cpu = cpu;
    this.ram = ram;
    this.storage = storage;
    this.wifi = wifi;
    this.bluetooth = bluetooth;
    this.gpu = gpu;
    this.operatingSystem = operatingSystem;
}
```

Usage:

```java
Computer computer =
        new Computer(
            "Intel i9",
            64,
            2000,
            true,
            true,
            "RTX 5090",
            "Windows"
        );
```

This works.

But look at:

```java
true,
true,
2000,
64
```

Without checking the constructor definition, it's hard to know what those values mean.

This becomes worse with 15 or 20 parameters.

---

# 2. Optional values make it worse

Suppose only `cpu` and `ram` are required.

Everything else is optional.

You might create multiple constructors:

```java
Computer(String cpu, int ram)
```

Then:

```java
Computer(
    String cpu,
    int ram,
    int storage
)
```

Then:

```java
Computer(
    String cpu,
    int ram,
    int storage,
    boolean wifi
)
```

Then:

```java
Computer(
    String cpu,
    int ram,
    int storage,
    boolean wifi,
    String gpu
)
```

This is known as the:

> **Telescoping Constructor Problem**

The constructors keep growing.

---

# 3. Another bad solution: setters

You might try:

```java
Computer computer =
        new Computer();

computer.setCpu("Intel i9");
computer.setRam(64);
computer.setStorage(2000);
computer.setWifi(true);
computer.setGpu("RTX 5090");
```

This is easier to read.

But now the object may exist in an invalid state.

For example:

```java
Computer computer =
        new Computer();
```

At this moment:

```text
cpu = null
ram = 0
storage = 0
```

Maybe that should never be allowed.

The object is only gradually becoming valid.

That can be dangerous.

---

# 4. Enter Builder

Instead of creating the final object directly, we use another object whose job is:

> Building the final object.

For example:

```java
Computer computer =
        new Computer.Builder()
            .cpu("Intel i9")
            .ram(64)
            .storage(2000)
            .wifi(true)
            .gpu("RTX 5090")
            .build();
```

This is much easier to read.

You immediately understand what each value means.

---

# 5. Basic Builder implementation

Let's implement it.

```java
class Computer {

    private final String cpu;
    private final int ram;
    private final int storage;
    private final boolean wifi;
    private final boolean bluetooth;
    private final String gpu;

    private Computer(Builder builder) {

        this.cpu = builder.cpu;
        this.ram = builder.ram;
        this.storage = builder.storage;
        this.wifi = builder.wifi;
        this.bluetooth = builder.bluetooth;
        this.gpu = builder.gpu;
    }

    public static class Builder {

        private String cpu;
        private int ram;
        private int storage;
        private boolean wifi;
        private boolean bluetooth;
        private String gpu;

        public Builder cpu(String cpu) {
            this.cpu = cpu;
            return this;
        }

        public Builder ram(int ram) {
            this.ram = ram;
            return this;
        }

        public Builder storage(int storage) {
            this.storage = storage;
            return this;
        }

        public Builder wifi(boolean wifi) {
            this.wifi = wifi;
            return this;
        }

        public Builder bluetooth(boolean bluetooth) {
            this.bluetooth = bluetooth;
            return this;
        }

        public Builder gpu(String gpu) {
            this.gpu = gpu;
            return this;
        }

        public Computer build() {
            return new Computer(this);
        }
    }
}
```

Usage:

```java
Computer computer =
        new Computer.Builder()
            .cpu("Intel i9")
            .ram(64)
            .storage(2000)
            .wifi(true)
            .bluetooth(true)
            .gpu("RTX 5090")
            .build();
```

That's the Builder Pattern.

---

# 6. Why do builder methods return `this`?

Look at:

```java
public Builder cpu(String cpu) {
    this.cpu = cpu;
    return this;
}
```

Returning:

```java
this
```

allows method chaining.

Because:

```java
builder.cpu("Intel i9")
```

returns the same builder.

Then we can immediately call:

```java
.ram(64)
```

which returns the builder again.

Then:

```java
.storage(2000)
```

So:

```java
new Computer.Builder()
    .cpu("Intel i9")
    .ram(64)
    .storage(2000)
    .build();
```

is really a sequence of calls on the same builder object.

This style is often called a:

> **Fluent API**

---

# 7. What does `build()` do?

The builder temporarily stores construction information.

For example:

```text
Builder

cpu = Intel i9
ram = 64
storage = 2000
wifi = true
```

Then:

```java
build()
```

creates the final object:

```java
return new Computer(this);
```

The final object copies the builder's state.

Conceptually:

```text
Builder
   |
   | build()
   v
Computer
```

After that, the builder and the finished object are separate objects.

---

# 8. Builder and immutability

Builder is especially useful for immutable objects.

Notice:

```java
private final String cpu;
private final int ram;
private final int storage;
```

There are no setters.

Once a `Computer` is created:

```java
Computer computer =
        new Computer.Builder()
            .cpu("AMD Ryzen 9")
            .ram(32)
            .build();
```

you can't later do:

```java
computer.setRam(128);
```

because no setter exists.

This can make objects safer.

Instead of:

```text
create object
modify object
modify again
possibly invalid state
```

we do:

```text
configure Builder
        ↓
validate
        ↓
build final object
        ↓
immutable object
```

---

# 9. Required vs optional fields

Suppose a computer must have:

```text
CPU
RAM
```

but everything else is optional.

One design is:

```java
public static class Builder {

    private final String cpu;
    private final int ram;

    private int storage = 512;
    private boolean wifi = true;
    private String gpu;

    public Builder(
            String cpu,
            int ram) {

        this.cpu = cpu;
        this.ram = ram;
    }
}
```

Now usage becomes:

```java
Computer computer =
        new Computer.Builder(
            "Intel i9",
            64
        )
        .storage(2000)
        .gpu("RTX 5090")
        .build();
```

The required fields must be provided immediately.

Optional fields can be configured later.

---

# 10. Default values

Builders make defaults convenient.

```java
public static class Builder {

    private String cpu;
    private int ram;

    private int storage = 512;

    private boolean wifi = true;

    private boolean bluetooth = true;

    private String operatingSystem =
            "Linux";
}
```

Now:

```java
Computer computer =
        new Computer.Builder()
            .cpu("AMD Ryzen 7")
            .ram(32)
            .build();
```

automatically receives:

```text
storage = 512
wifi = true
bluetooth = true
operatingSystem = Linux
```

The caller only specifies what differs from the defaults.

---

# 11. Validation inside `build()`

Suppose these are invalid:

```text
RAM <= 0
CPU missing
Storage < 128
```

We can validate before creating the final object:

```java
public Computer build() {

    if (cpu == null || cpu.isBlank()) {
        throw new IllegalStateException(
            "CPU is required"
        );
    }

    if (ram <= 0) {
        throw new IllegalStateException(
            "RAM must be positive"
        );
    }

    if (storage < 128) {
        throw new IllegalStateException(
            "Storage must be at least 128 GB"
        );
    }

    return new Computer(this);
}
```

Now:

```java
new Computer.Builder()
    .ram(32)
    .build();
```

fails before an invalid `Computer` is created.

This gives us a useful lifecycle:

```text
incomplete state allowed
inside Builder

        ↓ build()

validation

        ↓

valid Computer
```

That's a major Builder advantage.

---

# 12. Real-world example: HTTP request

Imagine constructing:

```java
HttpRequest request =
        new HttpRequest(
            "POST",
            "https://example.com/users",
            headers,
            queryParameters,
            body,
            5000,
            true,
            3
        );
```

That's difficult to understand.

Builder:

```java
HttpRequest request =
        new HttpRequest.Builder()
            .method("POST")
            .url("https://example.com/users")
            .header(
                "Authorization",
                "Bearer token"
            )
            .body(json)
            .timeout(5000)
            .followRedirects(true)
            .retries(3)
            .build();
```

Much clearer.

This is why builder-style APIs are very common in networking libraries.

---

# 13. Another example: User

Suppose:

```java
class User {

    private final String username;
    private final String email;
    private final String firstName;
    private final String lastName;
    private final String phone;
    private final String address;
    private final int age;
    private final boolean marketingEmails;
}
```

Without Builder:

```java
new User(
    "alice123",
    "alice@example.com",
    "Alice",
    "Smith",
    null,
    null,
    28,
    true
);
```

What's the first `null`?

What's the second `null`?

Builder:

```java
User user =
        new User.Builder()
            .username("alice123")
            .email("alice@example.com")
            .firstName("Alice")
            .lastName("Smith")
            .age(28)
            .marketingEmails(true)
            .build();
```

Far easier to understand.

---

# 14. Builder vs setters

These may look similar:

```java
Computer computer =
        new Computer();

computer.setCpu("Intel");
computer.setRam(32);
```

and:

```java
Computer computer =
        new Computer.Builder()
            .cpu("Intel")
            .ram(32)
            .build();
```

But there's an important difference.

With setters:

```text
Computer exists
before configuration is complete
```

With Builder:

```text
Builder exists
during configuration

Computer exists
only after build()
```

That means the final object can stay immutable and always valid.

---

# 15. Builder vs constructor

Constructors are perfectly good for simple objects.

This is excellent:

```java
Point point =
        new Point(10, 20);
```

Builder would be unnecessary:

```java
Point point =
        new Point.Builder()
            .x(10)
            .y(20)
            .build();
```

That's overengineering.

Builder becomes useful when constructors become difficult to understand or manage.

---

# 16. Builder vs Factory Method

Factory Method answers:

> Which concrete object should be created?

Example:

```java
createTransport();
```

might return:

```text
Truck
Ship
```

Builder answers:

> How should one complex object be constructed?

Example:

```java
new Computer.Builder()
    .cpu(...)
    .ram(...)
    .storage(...)
    .build();
```

So:

```text
Factory Method
→ chooses product type

Builder
→ assembles product configuration
```

---

# 17. Builder vs Abstract Factory

Abstract Factory:

```text
createButton()
createCheckbox()
createMenu()
```

creates several related objects.

Builder:

```text
cpu(...)
ram(...)
storage(...)
gpu(...)
build()
```

constructs one complex object.

A useful distinction:

```text
Abstract Factory
→ family of products

Builder
→ complex product step by step
```

---

# 18. Builder and different representations

The original Gang of Four Builder pattern can go further than the fluent builder commonly seen in Java.

Imagine building a report.

The same construction process:

```text
addTitle
addSection
addTable
addFooter
```

could produce:

```text
PDF
HTML
Markdown
```

We could have:

```java
interface ReportBuilder {

    void addTitle(String title);

    void addSection(String text);

    void addFooter(String text);
}
```

Then:

```java
class PdfReportBuilder
        implements ReportBuilder {
    ...
}
```

and:

```java
class HtmlReportBuilder
        implements ReportBuilder {
    ...
}
```

The construction steps stay similar, but the final representation differs.

That's closer to the classic GoF version.

---

# 19. The Director concept

The classic Builder pattern sometimes includes another participant:

> **Director**

The Director knows the sequence of construction steps.

For example:

```java
class ComputerDirector {

    public Computer createGamingComputer() {

        return new Computer.Builder()
            .cpu("Intel i9")
            .ram(64)
            .storage(2000)
            .gpu("RTX 5090")
            .wifi(true)
            .build();
    }
}
```

Or with a separate builder interface:

```java
class HouseDirector {

    public void buildLuxuryHouse(
            HouseBuilder builder) {

        builder.buildFoundation();
        builder.buildWalls();
        builder.buildRoof();
        builder.buildSwimmingPool();
    }
}
```

The Director describes:

> What steps happen and in what order.

The Builder knows:

> How those steps are implemented.

Modern Java fluent builders often omit a separate Director because callers invoke the builder directly.

---

# 20. Builder roles

The classic pattern can contain:

```text
Product
    Computer

Builder
    ComputerBuilder

Concrete Builder
    GamingComputerBuilder
    OfficeComputerBuilder

Director
    ComputerDirector
```

But many Java applications simplify this to:

```text
Product
    +
nested Builder
```

like:

```java
Computer.Builder
```

Both approaches use the same underlying idea.

---

# 21. Reusable builders

Suppose:

```java
Computer.Builder builder =
        new Computer.Builder()
            .cpu("Intel i9")
            .ram(64);
```

Then:

```java
Computer gaming =
        builder
            .gpu("RTX 5090")
            .build();
```

Could you reuse the same builder?

Technically, depending on implementation, yes.

But this can be dangerous because old state may remain.

For example:

```java
Computer office =
        builder
            .storage(1000)
            .build();
```

might still include:

```text
RTX 5090
```

from the previous build.

So a common practical approach is:

> Treat builders as short-lived construction objects.

---

# 22. Builder and thread safety

Builders are often mutable:

```java
builder.cpu(...)
builder.ram(...)
builder.storage(...)
```

So they usually should not be shared between threads unless explicitly designed to be thread-safe.

The final built object can still be immutable and thread-friendly.

This illustrates a useful pattern:

```text
mutable construction object
        ↓
immutable finished object
```

---

# 23. Builder and inheritance

Builder inheritance can become complicated.

Imagine:

```text
Vehicle
    ↑
Car
    ↑
ElectricCar
```

If every level adds builder fields, generic builder hierarchies can become difficult to maintain.

Sometimes composition or separate builders are simpler.

So Builder is not a magical solution for all construction problems.

---

# 24. Java example with getters

A complete version could look like:

```java
public class Computer {

    private final String cpu;
    private final int ram;
    private final int storage;
    private final boolean wifi;
    private final String gpu;

    private Computer(Builder builder) {

        this.cpu = builder.cpu;
        this.ram = builder.ram;
        this.storage = builder.storage;
        this.wifi = builder.wifi;
        this.gpu = builder.gpu;
    }

    public String getCpu() {
        return cpu;
    }

    public int getRam() {
        return ram;
    }

    public int getStorage() {
        return storage;
    }

    public boolean hasWifi() {
        return wifi;
    }

    public String getGpu() {
        return gpu;
    }

    public static class Builder {

        private String cpu;
        private int ram;
        private int storage = 512;
        private boolean wifi = true;
        private String gpu;

        public Builder cpu(String cpu) {
            this.cpu = cpu;
            return this;
        }

        public Builder ram(int ram) {
            this.ram = ram;
            return this;
        }

        public Builder storage(int storage) {
            this.storage = storage;
            return this;
        }

        public Builder wifi(boolean wifi) {
            this.wifi = wifi;
            return this;
        }

        public Builder gpu(String gpu) {
            this.gpu = gpu;
            return this;
        }

        public Computer build() {

            if (cpu == null) {
                throw new IllegalStateException(
                    "CPU is required"
                );
            }

            if (ram <= 0) {
                throw new IllegalStateException(
                    "RAM must be positive"
                );
            }

            return new Computer(this);
        }
    }
}
```

Usage:

```java
Computer computer =
        new Computer.Builder()
            .cpu("AMD Ryzen 9")
            .ram(64)
            .storage(2000)
            .gpu("RTX 5090")
            .build();
```

This is the style you'll most often encounter in Java applications.

---

# 25. Builder with mandatory constructor parameters

Another variation:

```java
public static class Builder {

    private final String cpu;
    private final int ram;

    private int storage = 512;
    private boolean wifi = true;
    private String gpu;

    public Builder(
            String cpu,
            int ram) {

        if (cpu == null) {
            throw new IllegalArgumentException();
        }

        if (ram <= 0) {
            throw new IllegalArgumentException();
        }

        this.cpu = cpu;
        this.ram = ram;
    }
}
```

Usage:

```java
Computer computer =
        new Computer.Builder(
            "Intel i7",
            32
        )
        .storage(1000)
        .wifi(true)
        .build();
```

Now callers cannot forget required fields.

---

# 26. Builder with static `builder()`

Many libraries use:

```java
Computer computer =
        Computer.builder()
            .cpu("Intel i9")
            .ram(64)
            .build();
```

This just adds:

```java
public static Builder builder() {
    return new Builder();
}
```

Then instead of:

```java
new Computer.Builder()
```

you write:

```java
Computer.builder()
```

It's mainly a convenience.

---

# 27. Lombok and `@Builder`

In real Java projects, you may see Lombok:

```java
@Builder
public class User {

    private String username;
    private String email;
    private int age;
}
```

Then Lombok generates builder code for you.

Usage can look like:

```java
User user =
        User.builder()
            .username("alice")
            .email("alice@example.com")
            .age(28)
            .build();
```

This removes boilerplate.

But there's an important lesson:

> Learn the pattern before relying on code generation.

You should understand what Lombok is generating and where validation or invariants belong.

---

# 28. Builder and Java records

Modern Java records already make simple immutable data objects concise:

```java
record User(
    String username,
    String email,
    int age
) {}
```

Usage:

```java
User user =
        new User(
            "alice",
            "alice@example.com",
            28
        );
```

For three parameters, Builder may not add much.

But imagine:

```java
record SearchRequest(
    String query,
    int page,
    int size,
    String sort,
    String category,
    Double minPrice,
    Double maxPrice,
    boolean includeOutOfStock
) {}
```

A builder may still improve readability when there are many optional values.

So records don't make Builder obsolete.

They reduce the need for it in simpler cases.

---

# 29. Real-world query example

Consider:

```java
SearchRequest request =
        new SearchRequest.Builder()
            .query("laptop")
            .page(1)
            .size(20)
            .sort("price")
            .category("electronics")
            .minPrice(500.0)
            .maxPrice(2000.0)
            .includeOutOfStock(false)
            .build();
```

Compare that with:

```java
new SearchRequest(
    "laptop",
    1,
    20,
    "price",
    "electronics",
    500.0,
    2000.0,
    false
);
```

Builder is much easier to read.

---

# 30. Builder and invalid combinations

Suppose:

```text
GPU requires powerSupply >= 750W
```

Builder can validate cross-field constraints:

```java
public Computer build() {

    if (gpu != null
            && powerSupplyWatts < 750) {

        throw new IllegalStateException(
            "GPU requires at least 750W"
        );
    }

    return new Computer(this);
}
```

This is especially useful when validity depends on several fields together.

---

# 31. Builder is not just parameter naming

A common misconception is:

> Builder is just a prettier constructor.

Not quite.

It can also encapsulate:

```text
defaults
validation
construction order
complex setup
optional configuration
multiple representations
immutability
```

So the real value is controlling the **construction process**.

---

# 32. When Builder is a good fit

Think about Builder when an object has many constructor parameters, many optional fields, important defaults, cross-field validation, or should be immutable but still easy to configure.

Also consider it when the construction process has meaningful steps.

If object creation is simple:

```java
new Money(100, "USD");
```

just use the constructor.

---

# 33. Common mistakes

One mistake is creating a builder for every class.

```java
new Name.Builder()
    .value("Alice")
    .build();
```

probably doesn't help.

Another mistake is allowing `build()` to create invalid objects.

A builder should ideally protect final object invariants.

Another mistake is making the builder as complicated as the object itself, with dozens of unrelated responsibilities.

Builder should simplify construction, not become another god object.

---

# 34. Interview answer

If asked:

> What is the Builder Pattern?

A strong answer is:

> Builder is a creational design pattern used to construct complex objects step by step. It separates the construction process from the final object and is especially useful when an object has many optional parameters, defaults, validation rules, or should remain immutable.

Then give an example:

> Instead of a `Computer` constructor with ten parameters, use `Computer.builder().cpu(...).ram(...).gpu(...).build()`.

That's a solid answer.

---

# 35. Creational patterns so far

We've now covered three different creation problems:

```text
Factory Method
→ Which concrete product should be created?

Abstract Factory
→ Which family of related products should be created?

Builder
→ How should one complex product be constructed?
```

They may all involve object creation, but they solve different problems.

That's exactly why memorizing definitions isn't enough.

The key is recognizing the design problem.

---

# 36. Mental model

Think:

```text
Builder
     |
     | configure
     v
Builder State

cpu = ...
ram = ...
gpu = ...
storage = ...

     |
     | build()
     v

Final Object
```

The final object's creation is delayed until its configuration is ready.

The most important recognition question is:

> **Is creating this object becoming difficult because it has many optional parameters, configuration steps, defaults, or validation rules?**

If yes, Builder is worth considering.

# Next: Lesson 10 — Prototype Pattern

Our next creation problem is different again.

Imagine creating an object is expensive:

```java
GameCharacter character =
        new GameCharacter();

character.load3DModel();
character.loadTextures();
character.loadAnimations();
character.loadWeapons();
character.configureAI();
```

Now you need 1,000 similar characters.

Instead of rebuilding everything from scratch, what if you could start from an existing configured object?

```java
GameCharacter copy =
        prototype.clone();
```

The **Prototype Pattern** creates new objects by copying existing ones.

Lesson 10 will cover shallow copy vs deep copy, Java's `Cloneable` problems, copy constructors, mutable references, prototypes in games and configuration systems, and when Prototype is better than Factory or Builder.
