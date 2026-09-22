# Lesson 27 — Memento Pattern

The **Memento Pattern** is used when you need to **save an object's state and restore it later without exposing its internal representation**.

The core idea is:

> Capture an object's internal state in a separate snapshot object, so the object can return to that state later.

Memento is commonly used for:

```text
undo / redo
checkpoints
editor history
game saves
workflow rollback
configuration snapshots
```

---

# 1. Start with the problem

Imagine a text editor:

```java
class TextEditor {

    private String text;

    public void setText(
            String text) {

        this.text = text;
    }

    public String getText() {
        return text;
    }
}
```

The user types:

```text
Hello
```

then:

```text
Hello world
```

then:

```text
Hello world!!!
```

Now the user presses:

```text
Undo
```

We want to return to:

```text
Hello world
```

Press Undo again:

```text
Hello
```

We need some way to remember previous states.

---

# 2. Naive approach

One simple implementation might be:

```java
List<String> history =
        new ArrayList<>();
```

Before every edit:

```java
history.add(
    editor.getText()
);
```

Then restore:

```java
editor.setText(
    history.remove(
        history.size() - 1
    )
);
```

For a simple string, that's fine.

But what if the editor has:

```text
text
cursor position
selection
font information
zoom level
document metadata
formatting state
```

Then the caretaker needs to know every internal field.

For example:

```java
history.add(
    new Snapshot(
        editor.getText(),
        editor.getCursor(),
        editor.getSelection(),
        editor.getZoom(),
        ...
    )
);
```

Now outside code understands the object's internals.

That's poor encapsulation.

---

# 3. The Memento idea

Instead, the object itself should know how to snapshot its state.

Conceptually:

```text
TextEditor
    |
    | createMemento()
    v
EditorMemento
```

Later:

```text
EditorMemento
    |
    | restore
    v
TextEditor
```

The outside world stores the snapshot but doesn't need to understand its contents.

---

# 4. The three classic roles

Memento has three main participants.

### Originator

The object whose state we want to save.

Example:

```java
TextEditor
```

### Memento

The snapshot containing saved state.

Example:

```java
EditorMemento
```

### Caretaker

Stores the Mementos.

Example:

```java
EditorHistory
```

Conceptually:

```text
Originator
   |
   | creates
   v
Memento
   ^
   |
Caretaker stores it
```

---

# 5. Basic implementation

Let's create a Memento.

```java
final class EditorMemento {

    private final String text;

    EditorMemento(
            String text) {

        this.text = text;
    }

    String getText() {
        return text;
    }
}
```

Then the Originator:

```java
class TextEditor {

    private String text = "";

    public void setText(
            String text) {

        this.text = text;
    }

    public String getText() {
        return text;
    }

    public EditorMemento save() {

        return new EditorMemento(
            text
        );
    }

    public void restore(
            EditorMemento memento) {

        this.text =
            memento.getText();
    }
}
```

---

# 6. Caretaker

Now create:

```java
class EditorHistory {

    private final Deque<EditorMemento>
            history =
            new ArrayDeque<>();

    public void push(
            EditorMemento memento) {

        history.push(memento);
    }

    public EditorMemento pop() {

        return history.pop();
    }

    public boolean isEmpty() {

        return history.isEmpty();
    }
}
```

The Caretaker stores snapshots.

It does not manipulate editor internals.

---

# 7. Usage

```java
TextEditor editor =
        new TextEditor();

EditorHistory history =
        new EditorHistory();
```

Start:

```java
editor.setText(
    "Hello"
);
```

Save:

```java
history.push(
    editor.save()
);
```

Edit:

```java
editor.setText(
    "Hello world"
);
```

Save:

```java
history.push(
    editor.save()
);
```

Edit again:

```java
editor.setText(
    "Hello world!!!"
);
```

Current state:

```text
Hello world!!!
```

Undo:

```java
editor.restore(
    history.pop()
);
```

Result:

```text
Hello world
```

---

# 8. Be careful about when you save

The exact undo behavior depends on when you snapshot.

For example:

```text
Save before every edit
```

versus:

```text
Save after every edit
```

produces different stack behavior.

A common design is:

```text
Before executing edit:
save current state

Then perform edit
```

Then Undo restores the last pre-edit state.

---

# 9. Better editor example

Let's make the editor slightly richer.

```java
class TextEditor {

    private String text = "";

    private int cursorPosition;

    public void type(
            String value) {

        text =
            text.substring(
                0,
                cursorPosition
            )
            + value
            + text.substring(
                cursorPosition
            );

        cursorPosition +=
            value.length();
    }

    public void moveCursor(
            int position) {

        this.cursorPosition =
                position;
    }

    public EditorMemento save() {

        return new EditorMemento(
            text,
            cursorPosition
        );
    }

    public void restore(
            EditorMemento memento) {

        this.text =
            memento.text();

        this.cursorPosition =
            memento.cursorPosition();
    }
}
```

Memento:

```java
record EditorMemento(
    String text,
    int cursorPosition
) {}
```

Now a snapshot preserves both:

```text
document text
cursor position
```

The caretaker doesn't need to know why those fields matter.

---

# 10. Why Memento protects encapsulation

Without Memento:

```java
history.save(
    editor.getText(),
    editor.getCursor(),
    editor.getSelection(),
    ...
);
```

The history system understands editor internals.

With Memento:

```java
history.push(
    editor.save()
);
```

The editor alone knows how to capture itself.

This is the main design benefit.

---

# 11. Memento should usually be immutable

A saved snapshot should represent:

> State at a particular moment.

If the snapshot is mutable:

```java
memento.setText(...);
```

then history can be accidentally corrupted.

So prefer:

```java
final class Memento
```

with final fields, or Java records:

```java
record EditorMemento(
    String text,
    int cursor
) {}
```

Immutability fits Memento extremely well.

---

# 12. Real-world example — game save

Imagine a game character:

```java
class Player {

    private int health;
    private int mana;

    private Position position;

    private int level;
}
```

Before entering a boss fight, create a checkpoint:

```java
GameMemento checkpoint =
        player.save();
```

If the player dies:

```java
player.restore(
    checkpoint
);
```

Now the game returns to the saved state.

---

# 13. Game Memento

```java
record PlayerMemento(
    int health,
    int mana,
    Position position,
    int level
) {}
```

Originator:

```java
class Player {

    private int health;
    private int mana;
    private Position position;
    private int level;

    public PlayerMemento save() {

        return new PlayerMemento(
            health,
            mana,
            position,
            level
        );
    }

    public void restore(
            PlayerMemento memento) {

        health =
            memento.health();

        mana =
            memento.mana();

        position =
            memento.position();

        level =
            memento.level();
    }
}
```

---

# 14. Deep copy matters

Suppose:

```java
Position position;
```

is mutable.

If the Memento stores the same object reference:

```java
new PlayerMemento(
    ...,
    position,
    ...
);
```

and later:

```java
position.setX(100);
```

the snapshot may also effectively point to the changed position.

Then it isn't really a historical snapshot.

So mutable nested state may need copying.

---

# 15. Shallow vs deep snapshot

Shallow snapshot:

```text
new outer Memento
shared nested objects
```

Deep snapshot:

```text
new Memento
copied nested mutable state
```

For immutable values:

```java
record Position(
    int x,
    int y
) {}
```

sharing is safe.

For mutable objects, you must decide carefully what needs copying.

This is very similar to the Prototype lesson.

---

# 16. Memento vs Prototype

Prototype asks:

> How do I create a new object by copying an existing object?

Memento asks:

> How do I capture and later restore historical state?

Prototype:

```text
existing object
    ↓ copy
new object
```

Memento:

```text
object
    ↓ save
snapshot
    ↓ restore later
same object
```

Memory shortcut:

```text
Prototype = duplicate

Memento = remember
```

---

# 17. Undo history

A typical undo system uses:

```java
Deque<Memento>
        undoStack;
```

Every change:

```text
save state
perform operation
```

Undo:

```text
restore previous snapshot
```

For redo, we usually need another stack.

---

# 18. Undo + redo

Let's define:

```java
class EditorHistory {

    private final Deque<EditorMemento>
            undoStack =
            new ArrayDeque<>();

    private final Deque<EditorMemento>
            redoStack =
            new ArrayDeque<>();
}
```

Before a change:

```java
undoStack.push(
    editor.save()
);
```

Then perform change.

When Undo happens:

```java
redoStack.push(
    editor.save()
);

editor.restore(
    undoStack.pop()
);
```

Redo:

```java
undoStack.push(
    editor.save()
);

editor.restore(
    redoStack.pop()
);
```

This creates the usual editor behavior.

---

# 19. New edit after Undo

Suppose history is:

```text
A → B → C
```

Current state:

```text
C
```

Undo:

```text
B
```

Now `C` is on the redo stack.

If the user makes a brand-new edit:

```text
B → D
```

then usually the old redo path:

```text
C
```

must be discarded.

So on a new edit:

```java
redoStack.clear();
```

This is standard undo/redo behavior.

---

# 20. Memento vs Command

This is one of the most important comparisons.

Both can support undo.

Command:

```text
Store action
and often inverse action
```

Memento:

```text
Store previous state
```

Example Command undo:

```text
Insert "abc"
→ undo by deleting 3 characters
```

Memento undo:

```text
Before edit:
save entire document state

Undo:
restore snapshot
```

---

# 21. Command undo example

Command:

```java
class InsertTextCommand {

    void execute() {
        editor.insert(text);
    }

    void undo() {
        editor.deleteLast(
            text.length()
        );
    }
}
```

No full snapshot required.

This can be memory-efficient.

---

# 22. Memento undo example

Memento:

```java
EditorMemento before =
        editor.save();

editor.insert("abc");
```

Undo:

```java
editor.restore(before);
```

This can be simpler when reversing individual operations is difficult.

---

# 23. Command vs Memento tradeoff

Command-based undo:

```text
Pros:
less snapshot memory
precise inverse actions

Cons:
inverse logic may be complicated
not every action is easily reversible
```

Memento-based undo:

```text
Pros:
simple restoration
works even when inverse action is complex

Cons:
snapshots may consume lots of memory
```

This is a very important design tradeoff.

---

# 24. Command + Memento together

These patterns are often combined.

For example:

```java
class EditCommand
        implements Command {

    private final TextEditor editor;

    private EditorMemento before;

    @Override
    public void execute() {

        before =
            editor.save();

        performEdit();
    }

    @Override
    public void undo() {

        editor.restore(before);
    }
}
```

Command represents:

```text
the action
```

Memento stores:

```text
state needed for undo
```

This is a powerful combination.

---

# 25. Caretaker shouldn't change Memento state

The caretaker's job is usually:

```text
store
retrieve
manage order/history
```

not:

```text
inspect and mutate originator internals
```

Ideally:

```java
history.push(
    editor.save()
);
```

and later:

```java
editor.restore(
    history.pop()
);
```

That's all.

---

# 26. Strict encapsulation version

Classic Memento emphasizes that the caretaker should have limited access.

In some languages, you can hide Memento internals very tightly.

In Java, a practical approach might be:

```java
public interface EditorSnapshot {
}
```

and internally:

```java
private static final class Memento
        implements EditorSnapshot {
    ...
}
```

The caretaker only sees:

```java
EditorSnapshot
```

not the internal fields.

---

# 27. Java nested class approach

Example:

```java
class TextEditor {

    public interface Snapshot {
    }

    private static final class Memento
            implements Snapshot {

        private final String text;

        private Memento(
                String text) {

            this.text = text;
        }
    }

    private String text;

    public Snapshot save() {

        return new Memento(
            text
        );
    }

    public void restore(
            Snapshot snapshot) {

        Memento memento =
            (Memento) snapshot;

        this.text =
            memento.text;
    }
}
```

Outside code can store:

```java
TextEditor.Snapshot
```

but cannot inspect the private state.

That's closer to the classic Memento intent.

---

# 28. Caretaker example

```java
class History {

    private final Deque<
        TextEditor.Snapshot
    > snapshots =
        new ArrayDeque<>();

    public void push(
            TextEditor.Snapshot snapshot) {

        snapshots.push(snapshot);
    }

    public TextEditor.Snapshot pop() {

        return snapshots.pop();
    }
}
```

The History knows only:

```text
snapshot object
```

not:

```text
text
cursor
selection
formatting
```

Excellent encapsulation.

---

# 29. Configuration rollback example

Imagine:

```java
class ApplicationConfig {

    private int timeout;
    private String endpoint;
    private boolean cachingEnabled;
}
```

Before applying new configuration:

```java
ConfigMemento previous =
        config.save();
```

Apply update.

If validation fails:

```java
config.restore(previous);
```

This is another natural Memento use case.

---

# 30. Workflow checkpoint example

Suppose a workflow changes several fields while progressing.

Before an experimental step:

```text
save current workflow state
```

If the operation fails:

```text
restore checkpoint
```

Memento can model local in-memory rollback.

It does **not** automatically give database transaction semantics.

That's an important distinction.

---

# 31. Memento is not a database transaction

Suppose:

```java
object.restore(snapshot);
```

restores Java memory.

But external effects may already have happened:

```text
email sent
payment charged
database row written
message published
```

Memento cannot magically undo those.

For external side effects, you may need:

```text
database transactions
compensating actions
Saga patterns
```

Memento primarily restores object state.

---

# 32. Snapshots can be expensive

Suppose an object contains:

```text
100 MB of state
```

and you keep:

```text
100 snapshots
```

that's potentially huge.

So a major Memento tradeoff is:

> memory consumption

especially for large or frequently changing objects.

---

# 33. Full snapshot vs incremental snapshot

Full snapshot:

```text
save everything every time
```

Simple but expensive.

Incremental snapshot:

```text
save only what changed
```

More efficient but more complex.

This leads toward techniques such as:

```text
deltas
change sets
event sourcing
```

but those are broader architectural ideas.

---

# 34. Example memory problem

Suppose a document is:

```text
10 MB
```

and you store a full snapshot for every keystroke.

After:

```text
1,000 edits
```

you could conceptually need:

```text
10 GB
```

ignoring sharing/compression.

Clearly not ideal.

Real editors typically use more sophisticated history representations.

---

# 35. Snapshot frequency

You don't always need to snapshot every tiny change.

Possible policies:

```text
every command
every few seconds
before important operations
after transaction boundaries
manual checkpoints
```

The right policy depends on:

```text
memory
performance
undo granularity
business requirements
```

---

# 36. Bounded history

Sometimes keep only the last:

```text
100 undo states
```

For example:

```java
class BoundedHistory {

    private final int limit = 100;

    private final Deque<Memento>
            history =
            new ArrayDeque<>();
}
```

When adding:

```java
if (history.size()
        == limit) {

    history.removeLast();
}
```

This controls memory growth.

---

# 37. Compression

Snapshots can sometimes be compressed.

For example:

```text
large text state
→ compressed snapshot
```

But compression adds CPU cost.

Again, optimization should be driven by actual requirements.

---

# 38. Memento and persistence

A Memento can sometimes be serialized:

```text
save game to disk
save editor session
persist checkpoint
```

But a classic in-memory Memento does not require persistence.

If you serialize it, consider:

```text
versioning
schema evolution
security
compatibility
```

because stored snapshots may outlive the current application version.

---

# 39. Game save to disk

For example:

```java
PlayerMemento save =
        player.save();

saveRepository.store(save);
```

Later:

```java
PlayerMemento save =
        saveRepository.load();

player.restore(save);
```

Now the Memento acts as persistent save state.

---

# 40. Security concern

Mementos may contain sensitive state:

```text
tokens
credentials
personal data
internal business information
```

If snapshots are persisted or logged, they must be protected appropriately.

A Memento is not automatically safe just because it's internal.

---

# 41. Memento vs serialization

Serialization answers:

> How do I convert object state into a storable/transmittable format?

Memento answers:

> How do I capture state for later restoration while preserving encapsulation?

You can serialize a Memento, but they solve different problems.

Memory shortcut:

```text
Serialization = representation transfer

Memento = historical snapshot
```

---

# 42. Memento vs caching

Cache:

> Store reusable results to avoid recomputation.

Memento:

> Store historical state for restoration.

Cache:

```text
key → computed value
```

Memento:

```text
time/history → previous object state
```

Different intent.

---

# 43. Memento vs State Pattern

State Pattern:

> Represent current behavioral mode.

Memento:

> Capture a historical snapshot.

For example:

```text
State:
PaidState

Memento:
order snapshot from 10 minutes ago
```

State tells us:

```text
what mode are we in?
```

Memento tells us:

```text
what did we look like earlier?
```

---

# 44. Memento vs Prototype again

They can even work together.

The Originator may create a Memento by internally cloning parts of itself.

For example:

```java
public Memento save() {

    return new Memento(
        deepCopy(configuration)
    );
}
```

Prototype-style copying may help implement snapshot creation.

But the pattern intent remains Memento.

---

# 45. Memento and immutability

Suppose the entire domain object is already immutable.

Then every new version is effectively a snapshot.

For example:

```java
record Document(
    String text,
    int cursor
) {}
```

Each edit returns a new `Document`.

History can simply store previous immutable objects.

In immutable architectures, explicit Memento classes may be less necessary.

---

# 46. Persistent data structures

Some functional systems use data structures that share unchanged memory between versions.

Conceptually:

```text
Version 1
Version 2
Version 3
```

may reuse most underlying nodes.

This gives Memento-like history with less copying.

That's beyond the basic pattern, but it shows how the snapshot idea evolves.

---

# 47. Common mistake — Memento exposes every internal field

Bad:

```java
public class EditorMemento {

    public String text;
    public int cursor;
    public Map<String, Object>
            internalState;
}
```

Now anyone can inspect and modify it.

If encapsulation matters, make the Memento:

```text
immutable
opaque
limited-access
```

---

# 48. Common mistake — shallow copying mutable state

Suppose:

```java
memento =
    new Memento(
        mutableList
    );
```

Then later:

```java
mutableList.add(...);
```

and the snapshot sees the same change.

The "snapshot" was not really frozen.

Copy mutable nested state when necessary.

---

# 49. Common mistake — snapshot everything blindly

If only:

```text
text
cursor
```

matter for restoration, don't necessarily snapshot:

```text
logger
database connection
cache
thread pool
HTTP client
```

Those are dependencies/resources, not meaningful historical state.

A Memento should capture the object's restorable logical state.

---

# 50. Common mistake — storing dependencies

Bad:

```java
record ServiceMemento(
    DatabaseConnection connection,
    HttpClient client,
    Executor executor,
    ...
) {}
```

These are not usually state to restore.

Memento should capture domain/application state, not infrastructure handles.

---

# 51. Common mistake — using Memento for distributed rollback

Suppose:

```text
Service A charged payment
Service B shipped item
```

Restoring an in-memory snapshot in Service A does not undo shipping.

Memento is not a distributed transaction mechanism.

This distinction becomes very important later when we study distributed systems.

---

# 52. Common mistake — unbounded history

If every operation adds a snapshot forever:

```java
history.push(
    originator.save()
);
```

memory grows forever.

Use policies such as:

```text
maximum history
checkpoint compression
periodic pruning
```

when appropriate.

---

# 53. Common mistake — originator and caretaker responsibilities mixed

Bad:

```java
class TextEditor {

    private List<Memento>
            allHistory;
}
```

This can be okay for a tiny design, but classic Memento separates:

```text
Originator
→ knows how to snapshot/restore

Caretaker
→ decides which snapshots to keep
```

That separation is often cleaner.

---

# 54. Why separate Caretaker?

Because snapshot management is a different responsibility.

Originator answers:

> What state must be captured?

Caretaker answers:

> When should we save?

and:

> How many snapshots should we keep?

Those are different design concerns.

---

# 55. Memento and SRP

With proper separation:

```text
TextEditor
→ editing + state capture/restore

EditorMemento
→ snapshot value

EditorHistory
→ history management
```

Each has a focused responsibility.

---

# 56. Memento and encapsulation

This is the principle most strongly associated with Memento.

The object itself controls:

```text
what gets captured
how it gets restored
```

Clients don't have to violate internals to implement history.

That's the heart of the pattern.

---

# 57. Memento and OCP

Suppose `TextEditor` gains:

```text
selection range
font
zoom
```

The editor can update its Memento implementation.

Ideally, the `EditorHistory` does not need to change.

That's a useful extension benefit.

---

# 58. Memento and DIP

The caretaker may depend on an opaque snapshot abstraction:

```java
Snapshot
```

rather than concrete originator internals.

Again, abstraction helps reduce coupling.

---

# 59. Example — drawing application

Imagine:

```text
Circle
Rectangle
Text
Lines
```

User performs edits.

A drawing document might snapshot:

```text
list of shapes
positions
sizes
styles
z-order
```

Undo can restore previous document state.

For large drawings, full snapshots may be expensive, so Command-based deltas might be preferable.

This is exactly the kind of tradeoff an LLD interview may expect you to discuss.

---

# 60. Example — form wizard

Suppose a multi-step form has:

```text
Step 1
Step 2
Step 3
Step 4
```

Before advancing, you may capture form state.

If the user clicks:

```text
Back
```

you can restore earlier state.

Again, useful when state is richer than just the current step number.

---

# 61. Example — database-like transaction simulation

Imagine an in-memory object:

```java
Inventory inventory;
```

Before an experimental operation:

```java
InventoryMemento before =
        inventory.save();
```

Try modifications.

If validation fails:

```java
inventory.restore(before);
```

Useful for local object rollback.

But again, this isn't equivalent to a real database transaction.

---

# 62. Snapshot naming

Good names include:

```text
EditorMemento
GameSnapshot
ConfigurationSnapshot
DocumentCheckpoint
OrderSnapshot
```

You don't have to literally use the word:

```text
Memento
```

Pattern names describe intent.

In production code, domain terminology can be clearer.

---

# 63. Recognition clues

Think Memento when requirements say:

```text
"We need undo/redo."

"We need checkpoints."

"We need to restore an object
to a previous state."

"We don't want history management
to know object internals."

"We need save-game behavior."

"We need snapshots of configuration."

"We need local rollback."
```

The strongest recognition question is:

> **Do we need to capture an object's state now so we can restore that same object to that state later?**

If yes, Memento is a strong candidate.

---

# 64. Interview answer

If asked:

> What is the Memento Pattern?

A strong answer is:

> Memento is a behavioral design pattern that captures and stores an object's internal state so that it can be restored later without exposing the object's internal representation. The object being saved is the Originator, the snapshot is the Memento, and the object managing snapshots is the Caretaker.

Then give the example:

> A text editor can create `EditorMemento` snapshots before edits, store them in an `EditorHistory`, and restore a previous snapshot when the user presses Undo.

---

# 65. Interview roles

Remember:

```text
Originator
→ creates/restores snapshot

Memento
→ stores snapshot state

Caretaker
→ manages snapshot history
```

For our example:

```text
TextEditor
→ Originator

EditorMemento
→ Memento

EditorHistory
→ Caretaker
```

---

# 66. Memento vs Command interview answer

A strong answer:

> Both can support undo. Command typically stores an action and knows how to reverse it, while Memento stores a snapshot of the object's previous state and restores that snapshot. Command can be more memory-efficient when inverse operations are simple, while Memento is convenient when restoring state is easier than reversing each operation.

---

# 67. Mental model

Remember:

```text
Originator
    |
    | save
    v
 Memento
    |
    | stored by
    v
Caretaker
```

Later:

```text
Caretaker
    |
    | returns Memento
    v
Originator
    |
    | restore
    v
Previous state
```

The simplest memory phrase:

> **Memento = snapshot + restore.**

---

# Behavioral patterns so far

We've now covered:

```text
Strategy
→ interchangeable algorithms

Observer
→ notify subscribers

Command
→ package actions

State
→ lifecycle-dependent behavior

Template Method
→ fixed algorithm skeleton

Chain of Responsibility
→ processing chain

Iterator
→ traversal

Mediator
→ centralized coordination

Memento
→ snapshot and restore
```

A compact mental model:

```text
Strategy        = choose HOW
Observer        = notify WHO
Command         = package WHAT
State           = lifecycle
Template Method = fixed workflow
Chain           = pipeline
Iterator        = traversal
Mediator        = coordination
Memento         = remember state
```

We now have only **2 classic GoF patterns left**:

```text
Visitor
Interpreter
```

So you have completed:

```text
5 / 5  Creational
7 / 7  Structural
9 / 11 Behavioral
```

That's:

# **21 / 23 GoF patterns complete**

---

# Next: Lesson 28 — Visitor Pattern

Visitor addresses a very different problem.

Imagine a structure with different element types:

```text
ShoppingCart
├── Book
├── Electronics
├── Grocery
└── Subscription
```

Now we need many operations:

```text
calculate tax
calculate shipping
export report
audit
apply insurance rules
```

One approach is to keep adding methods to every element:

```java
calculateTax();
calculateShipping();
export();
audit();
```

That makes the element hierarchy change every time a new operation is added.

Visitor flips the problem.

Instead of putting every operation inside the elements:

```text
Element
    ↓
accept(visitor)
```

we create external visitors:

```text
TaxVisitor
ShippingVisitor
ExportVisitor
```

and each Visitor knows what to do for each concrete element type.

Lesson 28 will cover **double dispatch**, `accept()`, why Visitor is powerful for stable object structures, Visitor vs Strategy, Visitor vs Iterator, compiler/AST examples, and its biggest tradeoff: **adding new operations becomes easy, but adding new element types becomes expensive**.
