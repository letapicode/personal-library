# Lesson 10 — Prototype Pattern

The **Prototype Pattern** is used when creating an object from scratch is expensive, complicated, or repetitive.

Instead of doing:

```java
new ExpensiveObject(...)
```

and rebuilding all its state every time, we start with an existing configured object and make a copy.

The core idea is:

> **Create new objects by copying an existing object.**

---

# 1. The basic problem

Imagine a game character:

```java
class GameCharacter {

    private String name;
    private int health;
    private String weapon;
    private String armor;
    private String model;
}
```

Creating one may involve expensive setup:

```java
GameCharacter character =
        new GameCharacter();

character.loadModel();
character.loadTextures();
character.loadAnimations();
character.loadDefaultEquipment();
character.configureAI();
```

Now imagine we need 1,000 enemies with almost the same configuration.

Doing all that setup 1,000 times may be wasteful.

Instead:

```java
GameCharacter prototype =
        createFullyConfiguredCharacter();
```

Then:

```java
GameCharacter enemy1 =
        prototype.copy();

GameCharacter enemy2 =
        prototype.copy();

GameCharacter enemy3 =
        prototype.copy();
```

Each new character begins as a copy of the prototype.

That's the Prototype Pattern.

---

# 2. Simple Prototype interface

We could define:

```java
interface Prototype<T> {

    T copy();
}
```

Then:

```java
class GameCharacter
        implements Prototype<GameCharacter> {

    private String name;
    private int health;
    private String weapon;

    public GameCharacter(
            String name,
            int health,
            String weapon) {

        this.name = name;
        this.health = health;
        this.weapon = weapon;
    }

    @Override
    public GameCharacter copy() {

        return new GameCharacter(
            this.name,
            this.health,
            this.weapon
        );
    }
}
```

Usage:

```java
GameCharacter original =
        new GameCharacter(
            "Orc",
            100,
            "Axe"
        );

GameCharacter copy =
        original.copy();
```

We created a new object from an existing one.

---

# 3. Prototype vs normal construction

Without Prototype:

```java
GameCharacter enemy =
        new GameCharacter(
            "Orc",
            100,
            "Axe"
        );
```

With Prototype:

```java
GameCharacter enemy =
        orcPrototype.copy();
```

The second approach becomes more useful when the prototype contains lots of configuration:

```text
model
textures
stats
skills
armor
AI settings
animation data
metadata
```

Instead of reconstructing all that setup, we duplicate the existing configuration.

---

# 4. A more realistic example

Imagine:

```java
class Enemy {

    private String type;
    private int health;
    private int damage;
    private double speed;
    private String model;
    private String animationSet;
    private String aiProfile;

    public Enemy(
            String type,
            int health,
            int damage,
            double speed,
            String model,
            String animationSet,
            String aiProfile) {

        this.type = type;
        this.health = health;
        this.damage = damage;
        this.speed = speed;
        this.model = model;
        this.animationSet = animationSet;
        this.aiProfile = aiProfile;
    }

    public Enemy copy() {

        return new Enemy(
            type,
            health,
            damage,
            speed,
            model,
            animationSet,
            aiProfile
        );
    }
}
```

Create a template once:

```java
Enemy orcPrototype =
        new Enemy(
            "Orc",
            100,
            20,
            3.5,
            "orc-model",
            "orc-animations",
            "aggressive-ai"
        );
```

Then:

```java
Enemy orc1 =
        orcPrototype.copy();

Enemy orc2 =
        orcPrototype.copy();

Enemy orc3 =
        orcPrototype.copy();
```

We don't need to remember all seven constructor parameters every time.

---

# 5. Customize the copy

Often you clone a prototype and then change a few fields.

For example:

```java
Enemy boss =
        orcPrototype.copy();

boss.setHealth(1000);
boss.setDamage(100);
```

Conceptually:

```text
Orc Prototype
     |
     | copy
     v
Regular Orc

Orc Prototype
     |
     | copy
     v
Boss Orc
     |
     + modify health
     + modify damage
```

This is useful when objects share most of their configuration but differ slightly.

---

# 6. Where Prototype becomes tricky

Copying simple values is easy.

For example:

```java
int health;
String name;
double speed;
```

But what happens with nested mutable objects?

Suppose:

```java
class Character {

    private String name;
    private List<String> weapons;
}
```

Now copying becomes more subtle.

---

# 7. Shallow copy

Suppose:

```java
public Character copy() {

    return new Character(
        this.name,
        this.weapons
    );
}
```

Now both objects reference the same list:

```text
Original
   |
   v
Weapons List
   ^
   |
Copy
```

That is called a:

> **Shallow copy**

The outer object is copied.

Nested references are shared.

---

# 8. Why shallow copies can be dangerous

Consider:

```java
List<String> weapons =
        new ArrayList<>();

weapons.add("Sword");

Character original =
        new Character(
            "Warrior",
            weapons
        );

Character copy =
        original.copy();
```

Now:

```java
copy.getWeapons()
    .add("Bow");
```

Because the list is shared, the original may now also contain:

```text
Sword
Bow
```

Even though we only changed the copy.

That's often unexpected.

---

# 9. Visualizing shallow copy

After shallow copying:

```text
Original Character
       |
       |
       v
   Weapons List
   ["Sword"]
       ^
       |
       |
Copied Character
```

Modify:

```java
copy.getWeapons().add("Bow");
```

Now:

```text
Original Character
       |
       v
["Sword", "Bow"]
       ^
       |
Copied Character
```

Both see the same mutable state.

---

# 10. Deep copy

A **deep copy** also copies nested mutable objects.

For example:

```java
public Character copy() {

    List<String> copiedWeapons =
            new ArrayList<>(
                this.weapons
            );

    return new Character(
        this.name,
        copiedWeapons
    );
}
```

Now:

```text
Original Character
       |
       v
Original Weapons List


Copied Character
       |
       v
Copied Weapons List
```

The two lists are independent.

Changing one does not affect the other.

---

# 11. Shallow vs deep copy

This distinction is extremely important.

### Shallow copy

```text
Copy outer object
Share referenced objects
```

### Deep copy

```text
Copy outer object
Copy nested mutable objects too
```

A useful mental model:

```text
Shallow copy:
new shell, shared internals

Deep copy:
new shell, new internals
```

---

# 12. Immutable objects change the situation

Suppose your nested object is immutable:

```java
record Address(
    String city,
    String country
) {}
```

Sharing an immutable object between prototypes may be perfectly safe because nobody can change it.

So deep-copying everything isn't always necessary.

The real concern is:

> **Mutable shared state**

If shared nested state cannot change, sharing may be fine.

---

# 13. Deep copy example with custom objects

Suppose:

```java
class Address {

    private String city;

    public Address(String city) {
        this.city = city;
    }

    public Address copy() {
        return new Address(city);
    }
}
```

And:

```java
class UserProfile {

    private String name;
    private Address address;

    public UserProfile(
            String name,
            Address address) {

        this.name = name;
        this.address = address;
    }
}
```

Bad shallow copy:

```java
public UserProfile copy() {

    return new UserProfile(
        name,
        address
    );
}
```

Better deep copy:

```java
public UserProfile copy() {

    return new UserProfile(
        name,
        address.copy()
    );
}
```

Now each profile has its own address.

---

# 14. Copy constructor

In Java, one clean way to implement Prototype is a **copy constructor**.

For example:

```java
class UserProfile {

    private String name;
    private Address address;

    public UserProfile(
            String name,
            Address address) {

        this.name = name;
        this.address = address;
    }

    public UserProfile(
            UserProfile other) {

        this.name = other.name;

        this.address =
                new Address(
                    other.address
                );
    }
}
```

Then:

```java
UserProfile copy =
        new UserProfile(original);
```

This is very explicit.

You control exactly what gets copied.

---

# 15. Copy constructor for nested objects

`Address` could also have:

```java
class Address {

    private String city;

    public Address(String city) {
        this.city = city;
    }

    public Address(Address other) {
        this.city = other.city;
    }
}
```

Then:

```java
public UserProfile(
        UserProfile other) {

    this.name = other.name;

    this.address =
            new Address(
                other.address
            );
}
```

This is often preferable to Java's native cloning mechanism.

---

# 16. Java's `Cloneable`

Java provides:

```java
Cloneable
```

and:

```java
Object.clone()
```

You may see:

```java
class Person
        implements Cloneable {

    private String name;

    @Override
    public Person clone() {

        try {

            return (Person)
                    super.clone();

        } catch (
            CloneNotSupportedException e
        ) {

            throw new AssertionError();
        }
    }
}
```

Then:

```java
Person copy =
        original.clone();
```

But this mechanism has several awkward aspects.

---

# 17. Why `Cloneable` is often disliked

`Cloneable` is unusual.

The interface itself contains no:

```java
clone()
```

method.

It is basically a marker interface.

Also:

```java
Object.clone()
```

performs a field-by-field shallow copy.

That means nested mutable references are still shared unless you manually fix them.

For example:

```java
class Person
        implements Cloneable {

    private List<String> hobbies;
}
```

`super.clone()` copies the `hobbies` reference, not the list itself.

So you still need:

```java
@Override
public Person clone() {

    try {

        Person copy =
            (Person) super.clone();

        copy.hobbies =
            new ArrayList<>(hobbies);

        return copy;

    } catch (
        CloneNotSupportedException e
    ) {

        throw new AssertionError();
    }
}
```

This can become error-prone.

---

# 18. Practical Java recommendation

In modern Java code, explicit approaches are often easier to reason about:

```text
copy()
```

or:

```text
copy constructor
```

rather than relying heavily on:

```java
Cloneable
```

For example:

```java
public Enemy copy() {
    return new Enemy(this);
}
```

is obvious and type-safe.

---

# 19. Prototype registry

Prototype gets especially interesting when we store predefined prototypes.

Imagine:

```java
class EnemyRegistry {

    private final Map<String, Enemy>
        prototypes =
            new HashMap<>();

    public void register(
            String key,
            Enemy enemy) {

        prototypes.put(
            key,
            enemy
        );
    }

    public Enemy create(String key) {

        Enemy prototype =
                prototypes.get(key);

        if (prototype == null) {
            throw new IllegalArgumentException(
                "Unknown enemy: " + key
            );
        }

        return prototype.copy();
    }
}
```

Now:

```java
EnemyRegistry registry =
        new EnemyRegistry();

registry.register(
    "ORC",
    new Enemy(
        "Orc",
        100,
        20
    )
);

registry.register(
    "DRAGON",
    new Enemy(
        "Dragon",
        1000,
        200
    )
);
```

Then:

```java
Enemy orc =
        registry.create("ORC");

Enemy dragon =
        registry.create("DRAGON");
```

The registry keeps template objects and returns copies.

---

# 20. Prototype Registry structure

Conceptually:

```text
Prototype Registry
      |
      +-- "ORC"
      |      |
      |      v
      |   Orc Prototype
      |
      +-- "DRAGON"
             |
             v
         Dragon Prototype
```

When requested:

```text
registry.create("ORC")
```

we do:

```text
Orc Prototype
     |
     | copy()
     v
New Orc
```

This can be powerful in configuration-heavy systems.

---

# 21. Example: document templates

Imagine a document system.

You have standard templates:

```text
Invoice
Contract
Resume
Proposal
```

Each document has:

```text
fonts
headers
footers
layout
company branding
default sections
metadata
```

Instead of rebuilding them every time:

```java
Document invoice =
        templateRegistry.create(
            "INVOICE"
        );
```

The registry copies a configured prototype.

Then the caller fills in:

```text
customer name
date
amount
line items
```

This is a natural Prototype use case.

---

# 22. Example: configuration objects

Suppose:

```java
class ServerConfig {

    private String region;
    private int timeout;
    private int retries;
    private boolean ssl;
    private Map<String, String> headers;
}
```

You might have a standard production configuration:

```text
timeout = 5000
retries = 3
ssl = true
headers = ...
```

Instead of reconstructing that every time:

```java
ServerConfig config =
        productionPrototype.copy();
```

Then:

```java
config.setRegion("us-east");
```

This lets you start from a known baseline.

---

# 23. Prototype vs Builder

This is important.

Builder says:

> Build a complex object step by step.

Prototype says:

> Start from an existing object and copy it.

Builder:

```java
Computer computer =
    Computer.builder()
        .cpu("Intel")
        .ram(64)
        .storage(2000)
        .build();
```

Prototype:

```java
Computer computer =
        gamingComputerPrototype.copy();
```

So:

```text
Builder
→ construction from configuration

Prototype
→ construction from existing instance
```

---

# 24. Prototype and Builder can work together

Suppose you have a prototype:

```java
Computer gamingPrototype =
        ...
```

You could copy it:

```java
Computer copy =
        gamingPrototype.copy();
```

Or create a builder from it:

```java
Computer modified =
        gamingPrototype
            .toBuilder()
            .ram(128)
            .build();
```

This style is common with immutable objects.

Conceptually:

```text
Existing Object
     |
     v
Builder preloaded
with old values
     |
     + modify fields
     |
     v
New Object
```

This combines Prototype-like copying with Builder-style modification.

---

# 25. Prototype vs Factory Method

Factory Method:

> Decide which concrete class to create.

Prototype:

> Create an object by copying another object.

Factory Method:

```java
Transport transport =
        createTransport();
```

Prototype:

```java
Enemy enemy =
        enemyPrototype.copy();
```

Factory focuses on:

```text
type selection
```

Prototype focuses on:

```text
state duplication
```

---

# 26. Prototype vs Abstract Factory

Abstract Factory creates:

```text
families of related products
```

Prototype creates:

```text
copies of existing configured objects
```

For example:

```text
Abstract Factory:
MacButton
MacCheckbox
MacMenu
```

Prototype:

```text
ConfiguredEnemy
    ↓ copy
NewEnemy
```

Different creation problems.

---

# 27. Prototype vs `new`

Prototype does not mean:

> Never use constructors.

Internally, your `copy()` implementation may still use:

```java
new Enemy(...)
```

The design difference is that callers don't need to reconstruct the object's complete state themselves.

The object itself understands how to duplicate its configuration.

---

# 28. When Prototype is useful

Prototype is a good candidate when:

- object creation is expensive,
- many objects share mostly identical configuration,
- construction requires many steps,
- you want predefined templates,
- runtime configuration should determine templates,
- copying an object is easier than rebuilding it.

Examples include:

```text
game enemies
document templates
UI templates
workflow definitions
server configurations
simulation objects
graphics objects
preconfigured requests
```

---

# 29. When Prototype is not useful

Suppose:

```java
new Point(10, 20);
```

That's simple.

Writing:

```java
Point copy =
        pointPrototype.copy();
```

adds no meaningful value unless the application specifically works with templates.

Likewise, copying complicated object graphs can become more difficult than simply constructing them.

Prototype is not automatically superior to constructors or Builder.

---

# 30. The hardest part: object graphs

Imagine:

```text
GameCharacter
 ├── Weapon
 │    └── Enchantments
 ├── Armor
 ├── Inventory
 │    └── Items
 └── AIConfig
```

What exactly should a copy share?

Should `Weapon` be copied?

Should `Inventory` be copied?

Should immutable `AIConfig` be shared?

Should cached textures be shared?

This is the main design challenge with Prototype.

You need to decide:

> Which parts represent independent mutable state, and which parts can safely be shared?

There isn't one universal answer.

---

# 31. Sometimes shallow copy is correct

Consider:

```java
class GameCharacter {

    private String name;

    private Texture texture;
}
```

Suppose `Texture` is immutable and takes 100 MB.

Deep-copying it for every character would be wasteful.

You might intentionally share it:

```text
Enemy 1 ----\
Enemy 2 -----+--> Immutable Texture
Enemy 3 ----/
```

That's perfectly reasonable.

Deep copy does not mean:

> Duplicate absolutely everything.

It means:

> Duplicate the mutable state that should belong independently to the new object.

---

# 32. Copy semantics should be documented

If you create:

```java
Enemy copy()
```

callers should ideally know whether:

```text
inventory is independent
texture is shared
AI config is copied
weapon is copied
```

Otherwise unexpected aliasing bugs may occur.

For complex models, copying behavior is part of the object's contract.

---

# 33. Prototype with inheritance

Suppose:

```java
abstract class Shape {

    private String color;

    public Shape(
            Shape source) {

        this.color =
                source.color;
    }

    public abstract Shape copy();
}
```

Circle:

```java
class Circle extends Shape {

    private int radius;

    public Circle(
            Circle source) {

        super(source);

        this.radius =
                source.radius;
    }

    @Override
    public Shape copy() {
        return new Circle(this);
    }
}
```

Rectangle:

```java
class Rectangle extends Shape {

    private int width;
    private int height;

    public Rectangle(
            Rectangle source) {

        super(source);

        this.width =
                source.width;

        this.height =
                source.height;
    }

    @Override
    public Shape copy() {
        return new Rectangle(this);
    }
}
```

Now:

```java
Shape shape =
        new Circle(...);

Shape copy =
        shape.copy();
```

Polymorphism chooses the correct copy behavior.

---

# 34. Why this is useful

The caller doesn't need:

```java
if (shape instanceof Circle) {
    ...
} else if (
    shape instanceof Rectangle
) {
    ...
}
```

Each subtype knows how to copy itself.

That's clean object-oriented design.

---

# 35. Prototype and OCP

Suppose we add:

```java
class Triangle extends Shape {

    @Override
    public Shape copy() {
        return new Triangle(this);
    }
}
```

Existing code:

```java
Shape copy =
        shape.copy();
```

doesn't need to change.

This aligns nicely with OCP.

---

# 36. Prototype and LSP

Each subtype must honor:

```java
Shape copy();
```

If:

```java
Triangle.copy()
```

returns something that isn't an equivalent independent Triangle representation, substitution becomes unreliable.

So LSP still matters.

---

# 37. Prototype and SRP

Should every object know how to copy itself?

Often that's reasonable because the object understands its internal structure best.

But for very large domain models, copy logic might become significant enough to extract into:

```text
mappers
copy services
assemblers
```

The right choice depends on complexity.

Patterns are guidelines, not rigid laws.

---

# 38. Common mistake: accidental shared mutable state

This is probably the biggest Prototype bug.

Bad:

```java
public Order copy() {

    return new Order(
        id,
        items
    );
}
```

if:

```java
items
```

is mutable.

Then changing:

```java
copy.getItems().clear();
```

may clear the original too.

Always inspect nested mutable references.

---

# 39. Common mistake: copying identity

Suppose:

```java
class Customer {

    private long databaseId;
    private String name;
}
```

If you copy the customer:

```java
Customer copy =
        customer.copy();
```

Should `databaseId` also be copied?

Maybe not.

A database identity may need to be:

```text
0
null
new ID
```

depending on the system.

This highlights an important distinction:

> A copy may duplicate state without necessarily duplicating identity.

---

# 40. Example: copying an order template

Suppose we have:

```java
class Order {

    private Long id;
    private String customer;
    private List<Item> items;
}
```

Prototype used as a template might do:

```java
public Order copy() {

    Order copy =
            new Order();

    copy.id = null;

    copy.customer =
            this.customer;

    copy.items =
            new ArrayList<>();

    for (Item item : items) {
        copy.items.add(
            item.copy()
        );
    }

    return copy;
}
```

Notice:

```text
ID not copied
items deep copied
customer information copied
```

Copy behavior reflects domain semantics.

---

# 41. Prototype registry + Factory ideas

Prototype Registry sometimes looks like a factory:

```java
Enemy enemy =
        registry.create("DRAGON");
```

From the caller's perspective, it is indeed creating objects.

But internally:

```java
return prototype.copy();
```

rather than:

```java
return new Dragon();
```

So patterns can overlap.

A registry can act as a creation service while internally using Prototype.

---

# 42. Interview definition

If asked:

> What is the Prototype Pattern?

A strong answer is:

> Prototype is a creational design pattern that creates new objects by copying existing objects rather than constructing them entirely from scratch. It is useful when object creation is expensive or when many objects share most of the same configuration.

Then mention:

> The main implementation concern is deciding between shallow and deep copying, especially when the object contains mutable nested references.

That's a strong interview answer.

---

# 43. Shallow copy interview question

If asked:

> What's the difference between shallow and deep copy?

Answer:

> A shallow copy creates a new outer object but preserves references to nested objects, so mutable nested state may be shared. A deep copy also duplicates nested mutable objects so that the copied object can be modified independently.

Example:

```text
Shallow:

Original ----\
              --> List
Copy --------/


Deep:

Original ------> List A

Copy ----------> List B
```

---

# 44. Prototype mental model

Remember:

```text
Configured Object
      |
      | copy()
      v
New Object
```

Instead of:

```text
Start from nothing
      |
      + configure
      + initialize
      + load
      + customize
      v
New Object
```

Prototype starts with something that already exists.

---

# Creational patterns so far

We now know four:

```text
Factory Method
→ Which concrete product should be created?

Abstract Factory
→ Which family of products should be created?

Builder
→ How should a complex object be constructed?

Prototype
→ Can I create the new object by copying
  an existing configured object?
```

These four patterns solve very different object-creation problems.

And now there's one classic creational pattern left.

# Next: Lesson 11 — Singleton Pattern

Singleton asks:

> **What if exactly one shared instance of a class should exist?**

For example:

```text
application configuration
shared registry
process-wide coordinator
```

At first, Singleton looks extremely simple:

```java
class Singleton {

    private static Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {

        if (instance == null) {
            instance =
                    new Singleton();
        }

        return instance;
    }
}
```

But this simple code opens up much deeper questions:

```text
What happens with multiple threads?

Why does double-checked locking need volatile?

What is eager vs lazy initialization?

Why is enum Singleton often safer in Java?

Why do many developers consider Singleton
an anti-pattern when overused?

What's the difference between Singleton
and a Spring singleton bean?

How does Singleton hurt testing
when it becomes hidden global state?
```

Those are exactly what we'll cover in **Lesson 11 — Singleton Pattern**.
