# Lesson 18 — Flyweight Pattern

The **Flyweight Pattern** is used when your application needs **a huge number of similar objects**, and storing all repeated data separately would waste memory.

The core idea is:

> Share common immutable state between many objects, and keep only the truly unique state separate.

This is mainly a **memory optimization pattern**.

---

# 1. The problem

Imagine you're building a forest simulation.

You have:

```text
1,000,000 trees
```

Each tree has:

```java
class Tree {

    private String species;
    private String texture;
    private String model;
    private String color;

    private int x;
    private int y;
}
```

Suppose many trees are identical species.

For example:

```text
300,000 Oak trees
400,000 Pine trees
300,000 Maple trees
```

Every Oak tree stores:

```text
species = "Oak"
texture = oakTexture
model = oak3DModel
color = ...
```

again and again.

But only:

```text
x
y
```

really differ between individual Oak trees.

We're duplicating enormous amounts of data.

---

# 2. Imagine the memory cost

Suppose a tree's shared graphical data takes:

```text
100 KB
```

If 1,000,000 trees each store their own copy:

```text
100 KB × 1,000,000
≈ 100 GB
```

That's terrible.

But if there are only:

```text
3 tree species
```

we only need three copies of the heavy graphical data.

Then each tree only stores lightweight coordinates.

That's where Flyweight enters.

---

# 3. Two kinds of state

Flyweight makes a very important distinction.

### Intrinsic state

State that can be shared.

For our tree:

```text
species
texture
model
color
```

These are the same for many trees.

### Extrinsic state

State unique to each occurrence.

For our tree:

```text
x
y
```

Every tree may have a different position.

This distinction is the heart of Flyweight.

---

# 4. Move shared data into a flyweight

Create:

```java
class TreeType {

    private final String species;
    private final String texture;
    private final String model;
    private final String color;

    public TreeType(
            String species,
            String texture,
            String model,
            String color) {

        this.species = species;
        this.texture = texture;
        this.model = model;
        this.color = color;
    }

    public void draw(
            int x,
            int y) {

        System.out.println(
            "Drawing "
            + species
            + " at ("
            + x
            + ", "
            + y
            + ")"
        );
    }
}
```

Notice something important.

`TreeType` contains the shared state:

```text
species
texture
model
color
```

But not:

```text
x
y
```

Coordinates are passed into:

```java
draw(x, y)
```

from outside.

---

# 5. Lightweight tree object

Now individual trees become:

```java
class Tree {

    private final int x;
    private final int y;

    private final TreeType type;

    public Tree(
            int x,
            int y,
            TreeType type) {

        this.x = x;
        this.y = y;
        this.type = type;
    }

    public void draw() {
        type.draw(x, y);
    }
}
```

Each `Tree` stores only:

```text
x
y
reference to shared TreeType
```

Instead of duplicating all the heavy data.

---

# 6. The structure

Conceptually:

```text
Tree 1
x = 10
y = 20
   \
    \
     ---> Oak TreeType

Tree 2
x = 50
y = 80
    /
   /

Tree 3
x = 100
y = 200
   \
    \
     ---> Pine TreeType
```

Many trees share the same `TreeType`.

That's Flyweight.

---

# 7. Flyweight factory

Now we need a way to make sure we reuse existing `TreeType` objects.

Create:

```java
class TreeTypeFactory {

    private static final Map<String, TreeType>
            types =
            new HashMap<>();

    public static TreeType getTreeType(
            String species,
            String texture,
            String model,
            String color) {

        String key =
                species
                + "|"
                + texture
                + "|"
                + model
                + "|"
                + color;

        if (!types.containsKey(key)) {

            types.put(
                key,
                new TreeType(
                    species,
                    texture,
                    model,
                    color
                )
            );
        }

        return types.get(key);
    }
}
```

Now:

```java
TreeType oak1 =
        TreeTypeFactory.getTreeType(
            "Oak",
            "oak.png",
            "oak.obj",
            "green"
        );

TreeType oak2 =
        TreeTypeFactory.getTreeType(
            "Oak",
            "oak.png",
            "oak.obj",
            "green"
        );
```

Then:

```java
oak1 == oak2
```

should be:

```text
true
```

The factory returns the shared flyweight instead of constructing another duplicate.

---

# 8. Forest example

Let's create a forest:

```java
class Forest {

    private final List<Tree>
            trees =
            new ArrayList<>();

    public void plantTree(
            int x,
            int y,
            String species,
            String texture,
            String model,
            String color) {

        TreeType type =
                TreeTypeFactory
                    .getTreeType(
                        species,
                        texture,
                        model,
                        color
                    );

        Tree tree =
                new Tree(
                    x,
                    y,
                    type
                );

        trees.add(tree);
    }

    public void draw() {

        for (Tree tree : trees) {
            tree.draw();
        }
    }
}
```

Usage:

```java
Forest forest =
        new Forest();

forest.plantTree(
    10,
    20,
    "Oak",
    "oak.png",
    "oak.obj",
    "green"
);

forest.plantTree(
    50,
    100,
    "Oak",
    "oak.png",
    "oak.obj",
    "green"
);

forest.plantTree(
    200,
    300,
    "Pine",
    "pine.png",
    "pine.obj",
    "dark-green"
);
```

We have:

```text
3 Tree objects
```

but only:

```text
2 TreeType objects
```

because both Oak trees share the same flyweight.

---

# 9. Visualizing the memory model

Without Flyweight:

```text
Tree 1
├── Oak species
├── Oak texture
├── Oak model
├── Oak color
├── x
└── y

Tree 2
├── Oak species
├── Oak texture
├── Oak model
├── Oak color
├── x
└── y
```

Repeated heavy state.

With Flyweight:

```text
Tree 1
├── x
├── y
└── type ───────┐

Tree 2           │
├── x            │
├── y            │
└── type ────────┤
                 ↓
              OakType
              ├── species
              ├── texture
              ├── model
              └── color
```

Much more memory-efficient.

---

# 10. Why shared state should usually be immutable

Suppose all Oak trees share:

```java
TreeType oak;
```

Now imagine one tree does:

```java
oak.setColor("purple");
```

Suddenly **every Oak tree** becomes purple.

That's dangerous.

So flyweights should usually be immutable:

```java
private final String species;
private final String texture;
private final String model;
```

and no setters.

This is extremely important.

> Shared mutable state is dangerous.

Flyweight works best with shared **immutable** intrinsic state.

---

# 11. Intrinsic vs extrinsic state

This is the terminology you'll often hear in interviews.

Intrinsic state:

> Stored inside the Flyweight because it can safely be shared.

Example:

```text
TreeType:
species
texture
model
color
```

Extrinsic state:

> Supplied externally because it differs per use.

Example:

```text
Tree:
x
y
```

A useful way to remember:

```text
Intrinsic
→ belongs to shared type

Extrinsic
→ belongs to individual occurrence
```

---

# 12. Another example — text editor

Imagine a document containing:

```text
5,000,000 characters
```

A naive `Character` object might contain:

```java
class Character {

    char symbol;

    String fontFamily;
    int fontSize;
    boolean bold;
    boolean italic;

    int x;
    int y;
}
```

That's huge if repeated millions of times.

But many characters share formatting.

For example:

```text
'A', Arial, 12, regular
```

may appear thousands of times.

So we can create a shared glyph/style object.

---

# 13. Character flyweight

```java
class CharacterStyle {

    private final String font;
    private final int size;
    private final boolean bold;
    private final boolean italic;

    public CharacterStyle(
            String font,
            int size,
            boolean bold,
            boolean italic) {

        this.font = font;
        this.size = size;
        this.bold = bold;
        this.italic = italic;
    }

    public void render(
            char value,
            int x,
            int y) {

        System.out.println(
            value
            + " using "
            + font
            + " "
            + size
            + " at "
            + x
            + ","
            + y
        );
    }
}
```

Then each character occurrence stores:

```text
character value
position
reference to shared style
```

instead of duplicating all style metadata.

This is similar to how large rendering systems often think about shared resources.

---

# 14. Another example — game bullets

Imagine a game has:

```text
100,000 bullets
```

Each bullet may use:

```text
same sprite
same model
same sound
same collision shape
```

but different:

```text
position
velocity
direction
remaining lifetime
```

So:

```text
BulletType
→ shared sprite/model/sound

Bullet
→ x, y, velocity, direction
```

A good Flyweight candidate.

---

# 15. Another example — map markers

Imagine a navigation application showing:

```text
500,000 map markers
```

Markers might be:

```text
restaurant
hospital
gas station
hotel
airport
```

Every hospital marker uses the same:

```text
icon
color
rendering style
```

Only:

```text
latitude
longitude
label
```

change.

So:

```text
MarkerStyle
→ flyweight

Marker
→ unique position/data
```

This can drastically reduce memory.

---

# 16. Flyweight roles

The classic pattern has several participants.

### Flyweight

The shared object:

```java
TreeType
```

### Concrete Flyweight

Specific shared instances:

```text
Oak TreeType
Pine TreeType
Maple TreeType
```

### Flyweight Factory

Creates or reuses flyweights:

```java
TreeTypeFactory
```

### Context

Stores unique extrinsic state and references the flyweight:

```java
Tree
```

So:

```text
Context
  |
  +--> extrinsic state
  |
  +--> reference to Flyweight
```

---

# 17. General structure

```text
Client
  |
  v
FlyweightFactory
  |
  +-- existing? return it
  |
  +-- missing? create it
  |
  v
Flyweight
```

Individual contexts:

```text
Context 1 ---> Flyweight A
Context 2 ---> Flyweight A
Context 3 ---> Flyweight A
Context 4 ---> Flyweight B
```

The whole point is:

> Lots of contexts, few flyweights.

---

# 18. Flyweight Factory and caching

You may notice:

```java
Map<Key, Flyweight>
```

looks like a cache.

Correct.

Flyweight factories often use caching internally.

But the intent is specifically:

> Reuse shared value/state objects to reduce memory usage.

A normal cache might be about:

```text
speed
avoiding expensive computation
avoiding network calls
```

Flyweight is primarily about:

```text
sharing repeated state
```

They overlap, but the intent is different.

---

# 19. Flyweight vs Prototype

This distinction is important.

Prototype says:

> Copy an existing object to create a new one.

Flyweight says:

> Don't copy repeated shared state at all—reuse the same object.

Prototype:

```text
Existing Object
    ↓ copy()
New Independent Object
```

Flyweight:

```text
Object 1 ─┐
Object 2 ─┼──> Shared Flyweight
Object 3 ─┘
```

Almost opposite instincts.

Prototype emphasizes duplication.

Flyweight emphasizes sharing.

---

# 20. Flyweight vs Singleton

Both involve shared objects, but they're very different.

Singleton:

> Ensure one instance of a class.

Flyweight:

> Reuse one instance for each distinct shared configuration.

For trees:

```text
OakType
PineType
MapleType
```

There are multiple flyweight instances.

Just one per unique shared state.

So:

```text
Singleton
→ one global instance

Flyweight
→ many shared instances,
  usually one per unique key
```

---

# 21. Flyweight vs Object Pool

Object Pool keeps reusable objects that may be checked out and returned.

Examples:

```text
database connections
threads
expensive buffers
```

Objects in a pool are often mutable and temporarily owned by one caller.

Flyweight objects are usually:

```text
shared simultaneously
immutable
read by many clients
```

So:

```text
Object Pool
→ reuse lifecycle/resources

Flyweight
→ share common state
```

---

# 22. Flyweight vs caching

Caching:

```text
input → remembered result
```

Flyweight:

```text
shared description/state → reused object
```

Example cache:

```java
cache.get(userId)
```

avoids repeated database work.

Example Flyweight:

```java
styleFactory.getStyle(
    "Arial",
    12,
    false
);
```

avoids duplicating identical style objects.

Again, implementation may look similar, but intent differs.

---

# 23. Flyweight and value objects

Flyweight works extremely well when the shared object behaves like an immutable value object.

Suppose:

```java
record Color(
    int red,
    int green,
    int blue
) {}
```

If thousands of objects use the same colors, you might reuse instances.

Java itself does similar optimizations in some contexts.

The general idea is:

> Immutable values are naturally shareable.

---

# 24. Java String Pool

A useful conceptual example is Java string interning.

Suppose:

```java
String a = "hello";
String b = "hello";
```

String literals can share a pooled instance.

Conceptually:

```text
a ──┐
    ├──> "hello"
b ──┘
```

This resembles Flyweight thinking:

> Reuse identical immutable objects rather than duplicate them.

You shouldn't think of Java's String pool as a textbook implementation you must reproduce, but it is a helpful mental analogy.

---

# 25. Integer caching

Similarly, Java may reuse boxed integer instances for a range of values.

For example, conceptually:

```java
Integer a = 100;
Integer b = 100;
```

may refer to the same cached boxed object.

Again, this resembles the broader idea:

> Small immutable values can be safely shared.

Be careful not to rely on identity comparisons like:

```java
a == b
```

for boxed value semantics, though; use `.equals()`.

The useful point here is the shared-object concept.

---

# 26. Flyweight and memory measurement

Flyweight is one of those patterns where you should ask:

> Do I actually have a memory problem?

Suppose you have:

```text
100 objects
```

each duplicating 50 bytes.

That's only:

```text
5 KB
```

Adding factories, maps, keys, and indirection may not be worth it.

Flyweight becomes valuable when:

```text
object count is huge
shared state is substantial
duplication is measurable
```

This is a pattern you should often justify with profiling.

---

# 27. Don't optimize blindly

This is very important.

Don't see:

```java
class Product {
    String category;
}
```

and immediately create:

```text
ProductCategoryFlyweightFactoryManager
```

because some category strings repeat.

Modern JVMs and application memory behavior are complex.

Optimize when:

```text
memory consumption matters
profiling identifies duplication
large object counts exist
```

Flyweight is an optimization tool, not a default coding style.

---

# 28. Factory key design

Suppose:

```java
TreeTypeFactory.getTreeType(
    species,
    texture,
    model,
    color
);
```

We need a key representing shared state.

Instead of manually doing:

```java
species + "|" + texture + ...
```

a cleaner design might use a record:

```java
record TreeTypeKey(
    String species,
    String texture,
    String model,
    String color
) {}
```

Then:

```java
class TreeTypeFactory {

    private final Map<TreeTypeKey, TreeType>
            cache =
            new HashMap<>();

    public TreeType getTreeType(
            TreeTypeKey key) {

        return cache.computeIfAbsent(
            key,
            k -> new TreeType(
                k.species(),
                k.texture(),
                k.model(),
                k.color()
            )
        );
    }
}
```

This is safer and clearer.

---

# 29. `computeIfAbsent`

Java gives us a convenient method:

```java
map.computeIfAbsent(
    key,
    k -> createValue(k)
);
```

So a flyweight factory often becomes:

```java
public TreeType getTreeType(
        TreeTypeKey key) {

    return cache.computeIfAbsent(
        key,
        k -> new TreeType(
            k.species(),
            k.texture(),
            k.model(),
            k.color()
        )
    );
}
```

If the flyweight already exists:

```text
return existing object
```

Otherwise:

```text
create
store
return
```

Exactly what we want.

---

# 30. Thread safety

Suppose many threads call:

```java
factory.getTreeType(...)
```

at the same time.

A plain:

```java
HashMap
```

may not be safe.

You might use:

```java
ConcurrentHashMap
```

depending on the system.

For example:

```java
private final Map<TreeTypeKey, TreeType>
        cache =
        new ConcurrentHashMap<>();
```

Then:

```java
return cache.computeIfAbsent(
    key,
    this::createType
);
```

Flyweight factories shared across threads need the same concurrency care as other shared structures.

---

# 31. Immutability helps concurrency too

Because flyweights are shared broadly, immutable flyweights are not only safer logically but easier for concurrency.

If:

```java
TreeType
```

contains only:

```java
final
```

fields and no mutation, many threads can reuse the same object safely.

That is another strong reason to make intrinsic state immutable.

---

# 32. Extrinsic state should stay outside

Suppose we accidentally put:

```java
int x;
int y;
```

inside `TreeType`.

Then all trees sharing the same `TreeType` would also share position.

Changing one tree's location would affect every tree using that type.

So unique state belongs in:

```java
Tree
```

not:

```java
TreeType
```

This is probably the most important modeling decision in Flyweight.

---

# 33. Another example — chess pieces

Imagine an online chess platform with millions of boards.

Each board has:

```text
32 pieces
```

Every white rook has the same:

```text
sprite
shape
display metadata
piece type
```

but different:

```text
board position
game identity
move state
```

So you could conceptually share:

```text
WhiteRookType
BlackRookType
WhiteKnightType
...
```

while individual board pieces hold the unique state.

Whether this is actually necessary depends on memory measurements, but the model demonstrates Flyweight nicely.

---

# 34. Another example — particle systems

A game may display:

```text
millions of particles
```

Particles may share:

```text
texture
shader
mesh
material
```

while differing in:

```text
position
velocity
age
rotation
```

Shared rendering resources can be extremely important in graphics systems.

This is strong Flyweight territory.

---

# 35. Flyweight can reduce object count too

Sometimes Flyweight reduces not only data duplication but also the number of heavy objects.

Without Flyweight:

```text
1,000,000 Tree objects
each with heavy TreeType data
```

With Flyweight:

```text
1,000,000 lightweight Tree contexts
+
3 heavy TreeType objects
```

The million context objects still exist, but they're much smaller.

In some systems, extrinsic state may even be stored more compactly in arrays or buffers rather than full objects.

Flyweight is about the general principle of factoring out shared state.

---

# 36. Flyweight and composition

A context usually **has a** flyweight:

```java
class Tree {

    private TreeType type;
}
```

So again we're using composition.

The context combines:

```text
shared state
+
unique state
```

at runtime.

---

# 37. Flyweight and SRP

`TreeType`:

```text
stores shared tree characteristics
```

`Tree`:

```text
stores unique placement state
```

`TreeTypeFactory`:

```text
manages flyweight reuse
```

The responsibilities are nicely separated.

---

# 38. Flyweight and OCP

Suppose we add:

```text
Birch
Cherry
Palm
```

No structural change is required.

The factory simply creates more distinct `TreeType` values as needed.

But Flyweight is less about OCP than most patterns we've covered.

Its main purpose is memory efficiency.

---

# 39. Flyweight and identity

Suppose:

```java
TreeType oakA =
        factory.get(...);

TreeType oakB =
        factory.get(...);
```

They may be the exact same object.

So be careful about object identity.

Flyweights typically represent:

```text
shared value/state
```

not unique domain identities.

A `TreeType` is not "Tree #8271."

It's:

```text
the Oak type definition
```

Many trees can reference it.

---

# 40. Don't place unique identity in the flyweight

Bad:

```java
class TreeType {

    private long treeId;
    private String species;
}
```

If multiple trees share this object, which tree does `treeId` belong to?

It doesn't make sense.

Unique identity should stay in the context:

```java
class Tree {

    private long id;
    private int x;
    private int y;
    private TreeType type;
}
```

That's another way to distinguish intrinsic and extrinsic state.

---

# 41. Flyweight factory lifecycle

Where should the flyweight factory live?

Possibilities include:

```text
application scope
rendering subsystem
document scope
game world scope
request scope
```

It depends on how long sharing should occur.

Making it a Singleton automatically isn't required.

For example:

```java
TreeTypeFactory factory =
        new TreeTypeFactory();
```

could be injected into a `Forest`.

Again:

> Shared does not automatically mean Singleton.

---

# 42. Common mistake: global Flyweight cache forever

Suppose your application creates millions of unique flyweight keys over time.

If the factory retains everything forever:

```java
Map<Key, Flyweight>
```

can itself become a memory leak.

That's ironic: a memory optimization causing memory problems.

Depending on the system, you may need:

```text
bounded cache
weak references
eviction
scope-limited factories
```

So Flyweight doesn't mean "cache everything forever."

---

# 43. Common mistake: mutable shared state

This is the biggest one.

Bad:

```java
sharedType.setTexture(...);
```

if many contexts use it.

One mutation affects all clients.

Keep intrinsic state immutable whenever possible.

---

# 44. Common mistake: expensive lookup

Suppose every render call does:

```java
factory.getTreeType(...)
```

using a huge expensive key computation.

You may save memory but introduce CPU overhead.

A better design may store the resolved flyweight reference once in each context:

```java
private final TreeType type;
```

Then rendering is cheap.

Flyweight trades one kind of resource usage for another, so measure.

---

# 45. Common mistake: forcing too much state outside

You could push almost everything into extrinsic state:

```java
flyweight.draw(
    species,
    texture,
    model,
    color,
    x,
    y,
    ...
);
```

At some point, the Flyweight becomes useless and callers carry too much configuration around.

The goal is to find a natural boundary between:

```text
shared immutable state
```

and:

```text
unique occurrence state
```

---

# 46. Flyweight vs immutable shared configuration

Sometimes you may already be doing Flyweight-like design without calling it that.

For example:

```java
class Product {

    private ProductDefinition definition;
    private int quantity;
}
```

where many product instances share the same immutable:

```java
ProductDefinition
```

That's conceptually similar.

Patterns are about recognizing useful structures, not necessarily naming every class `Flyweight`.

---

# 47. Interview answer

If asked:

> What is the Flyweight Pattern?

A strong answer is:

> Flyweight is a structural design pattern used to reduce memory consumption when a system has a very large number of similar objects. It separates shared intrinsic state into reusable flyweight objects and keeps unique extrinsic state outside those flyweights.

Then give the tree example:

> Instead of every tree storing its species, texture, and 3D model, thousands of trees can share a `TreeType`, while each `Tree` stores only its coordinates and a reference to that type.

That's a strong answer.

---

# 48. Interview question: intrinsic vs extrinsic state

A strong answer:

> Intrinsic state is state that does not depend on the individual context and can be shared safely among many objects. Extrinsic state varies per occurrence and is supplied or stored outside the flyweight.

Example:

```text
TreeType:
species
texture
model
→ intrinsic

Tree:
x
y
→ extrinsic
```

---

# 49. Interview comparison

A useful comparison:

```text
Prototype
→ copy objects

Flyweight
→ share objects

Singleton
→ enforce one instance

Object Pool
→ reuse temporary resources

Cache
→ remember expensive results
```

That distinction is worth knowing.

---

# 50. Recognition clues

Think Flyweight when requirements say:

```text
"We have millions of objects."

"Most of their data is identical."

"Memory consumption is too high."

"Large immutable resources are duplicated."

"Many objects differ only by position/state."

"We can separate shared state
from per-instance state."
```

The recognition question is:

> **Are we duplicating large amounts of identical state across a huge number of objects?**

If yes, Flyweight may help.

---

# 51. Mental model

Remember:

```text
Context
├── unique state
└── reference
       |
       v
   Flyweight
   └── shared state
```

Many contexts:

```text
Context A ─┐
Context B ─┼──> Flyweight 1
Context C ─┘

Context D ─────> Flyweight 2
```

The central idea is:

> **Share what is common. Store separately what is unique.**

---

# Structural Patterns complete

You've now covered all seven classic GoF structural patterns:

```text
Adapter
→ Make incompatible interfaces work together.

Decorator
→ Add behavior dynamically by wrapping.

Facade
→ Simplify a complex subsystem.

Composite
→ Treat individual objects and groups uniformly.

Proxy
→ Control access to another object.

Bridge
→ Separate two independent dimensions of variation.

Flyweight
→ Share common state across many objects
  to reduce memory usage.
```

A compact memory model:

```text
Adapter   = translate
Decorator = enhance
Facade    = simplify
Composite = tree
Proxy     = control
Bridge    = separate dimensions
Flyweight = share
```

And notice how different their intentions are even when some implementations look structurally similar.

That is one of the biggest lessons of design patterns:

> **Patterns are defined more by the problem they solve than by the exact code structure.**

# Next: Lesson 19 — Strategy Pattern

Now we move into **Behavioral Patterns**.

Behavioral patterns focus on:

> How objects communicate, choose behavior, and divide responsibilities.

We'll begin with **Strategy**, which you've already encountered several times during SOLID.

Suppose:

```java
class PaymentService {

    void pay(
            String type,
            double amount) {

        if (type.equals("CARD")) {
            ...
        } else if (
            type.equals("PAYPAL")) {
            ...
        } else if (
            type.equals("CRYPTO")) {
            ...
        }
    }
}
```

The varying thing is:

```text
payment algorithm
```

Strategy turns those algorithms into interchangeable objects:

```text
PaymentStrategy
├── CardPayment
├── PayPalPayment
└── CryptoPayment
```

and the client composes one:

```java
PaymentService service =
        new PaymentService(
            new CardPayment()
        );
```

**Lesson 19 — Strategy Pattern** will go deeper than our earlier examples: runtime switching, Strategy vs Bridge, Strategy vs State, lambdas as strategies, Java functional interfaces, avoiding giant `if/else` chains, and when Strategy is actually overengineering.
