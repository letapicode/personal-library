# Lesson 25 — Iterator Pattern

The **Iterator Pattern** is used when you want to traverse a collection **without exposing how that collection is internally stored**.

The core idea is:

> Separate traversal logic from the collection itself.

A client should be able to say:

```java
while (iterator.hasNext()) {
    Item item = iterator.next();
}
```

without caring whether the collection internally uses:

```text
array
ArrayList
LinkedList
tree
graph
database cursor
remote page
```

Iterator is especially important in Java because it is built directly into the Collections Framework.

---

# 1. Start with the problem

Suppose we build a playlist.

```java
class Playlist {

    private Song[] songs;

    private int size;

    public Playlist(int capacity) {
        songs = new Song[capacity];
    }

    public void add(Song song) {
        songs[size++] = song;
    }

    public Song[] getSongs() {
        return songs;
    }
}
```

Client:

```java
Song[] songs =
        playlist.getSongs();

for (int i = 0;
        i < songs.length;
        i++) {

    Song song = songs[i];

    if (song != null) {
        System.out.println(
            song.getTitle()
        );
    }
}
```

This works.

But notice what the client knows.

It knows that:

```text
Playlist uses an array.

Unused positions may contain null.

Traversal requires an index.

The client must know size/storage details.
```

We've exposed internal representation.

---

# 2. What happens if storage changes?

Suppose we change:

```java
Song[]
```

to:

```java
LinkedList<Song>
```

Now client traversal code may also need to change.

That's unwanted coupling.

The client should care about:

> Give me the next song.

not:

> How exactly are songs stored?

Iterator solves this.

---

# 3. Iterator abstraction

A simple iterator might be:

```java
interface Iterator<T> {

    boolean hasNext();

    T next();
}
```

The client only uses those operations.

Conceptually:

```text
Collection
   |
   v
Iterator
   |
   +--> hasNext()
   +--> next()
```

The Iterator knows how to move through the collection.

The client doesn't.

---

# 4. Playlist iterator

Let's first build our own simplified iterator.

```java
class PlaylistIterator
        implements Iterator<Song> {

    private final Song[] songs;

    private final int size;

    private int position = 0;

    public PlaylistIterator(
            Song[] songs,
            int size) {

        this.songs = songs;
        this.size = size;
    }

    @Override
    public boolean hasNext() {

        return position < size;
    }

    @Override
    public Song next() {

        return songs[position++];
    }
}
```

Now the playlist can provide:

```java
public Iterator<Song>
        iterator() {

    return new PlaylistIterator(
        songs,
        size
    );
}
```

Client:

```java
Iterator<Song> iterator =
        playlist.iterator();

while (iterator.hasNext()) {

    Song song =
            iterator.next();

    System.out.println(
        song.getTitle()
    );
}
```

The client no longer knows anything about the internal array.

---

# 5. Structure

Classic Iterator typically has:

### Iterator

Defines traversal:

```java
interface Iterator<T> {

    boolean hasNext();

    T next();
}
```

### Concrete Iterator

Knows how to traverse a specific collection.

```text
PlaylistIterator
TreeIterator
HistoryIterator
```

### Aggregate / Collection

Provides an iterator.

```java
interface IterableCollection<T> {

    Iterator<T> iterator();
}
```

### Concrete Aggregate

Actual collection:

```text
Playlist
Menu
CustomList
Tree
```

Conceptually:

```text
Collection
    |
    | creates
    v
Iterator
    |
    | traverses
    v
Elements
```

---

# 6. Java already has Iterator

Java provides:

```java
java.util.Iterator<T>
```

Its key methods are:

```java
boolean hasNext();

T next();
```

and optionally:

```java
default void remove()
```

depending on implementation.

So we normally don't create our own `Iterator` interface.

We implement Java's one.

---

# 7. Java's `Iterable<T>`

Java also provides:

```java
java.lang.Iterable<T>
```

Its key method is:

```java
Iterator<T> iterator();
```

So if a custom collection implements:

```java
Iterable<Song>
```

Java understands that it can be iterated.

---

# 8. Playlist implementing `Iterable`

Let's redesign:

```java
class Playlist
        implements Iterable<Song> {

    private final Song[] songs;

    private int size;

    public Playlist(int capacity) {
        songs = new Song[capacity];
    }

    public void add(Song song) {

        songs[size++] = song;
    }

    @Override
    public Iterator<Song>
            iterator() {

        return new PlaylistIterator(
            songs,
            size
        );
    }
}
```

Now we can write:

```java
Iterator<Song> iterator =
        playlist.iterator();
```

But something even better becomes possible.

---

# 9. Enhanced `for` loop

Because `Playlist` implements:

```java
Iterable<Song>
```

we can write:

```java
for (Song song : playlist) {

    System.out.println(
        song.getTitle()
    );
}
```

This:

```java
for (Song song : playlist)
```

is syntactic sugar around an Iterator.

Conceptually, Java does something like:

```java
Iterator<Song> iterator =
        playlist.iterator();

while (iterator.hasNext()) {

    Song song =
            iterator.next();

    ...
}
```

That's a direct everyday example of a design pattern built into the language ecosystem.

---

# 10. Complete custom Java iterator

A safer version should handle invalid calls to `next()`.

```java
class PlaylistIterator
        implements Iterator<Song> {

    private final Song[] songs;

    private final int size;

    private int position;

    PlaylistIterator(
            Song[] songs,
            int size) {

        this.songs = songs;
        this.size = size;
    }

    @Override
    public boolean hasNext() {

        return position < size;
    }

    @Override
    public Song next() {

        if (!hasNext()) {

            throw new
                NoSuchElementException();
        }

        return songs[position++];
    }
}
```

According to Java's Iterator contract, calling `next()` when no element remains should throw:

```java
NoSuchElementException
```

rather than return `null`.

---

# 11. Why not just expose the collection?

You might ask:

> Why not simply return `List<Song>`?

Sometimes that's perfectly fine.

For example:

```java
public List<Song> songs() {
    return List.copyOf(songs);
}
```

But Iterator is useful when you want to expose traversal without exposing:

```text
representation
mutation operations
storage implementation
all elements at once
```

Especially for custom, lazy, or expensive traversal.

---

# 12. Encapsulation benefit

Without Iterator:

```java
playlist.getInternalArray();
```

exposes implementation details.

With Iterator:

```java
playlist.iterator();
```

exposes only:

> How to visit elements.

That's encapsulation.

The collection remains free to change its internal storage.

---

# 13. Array implementation can change to List

Suppose later `Playlist` becomes:

```java
class Playlist
        implements Iterable<Song> {

    private final List<Song> songs =
            new ArrayList<>();

    public void add(Song song) {
        songs.add(song);
    }

    @Override
    public Iterator<Song>
            iterator() {

        return songs.iterator();
    }
}
```

Client code still remains:

```java
for (Song song : playlist) {
    ...
}
```

No client change required.

That's the power of the abstraction.

---

# 14. Multiple traversal strategies

Iterator becomes even more interesting when the same structure can be traversed in different ways.

Imagine a tree.

```text
        A
       / \
      B   C
     / \
    D   E
```

Possible traversal orders include:

```text
Depth-first
Breadth-first
Preorder
Postorder
Inorder
```

The tree structure stays the same.

The Iterator can encapsulate the traversal algorithm.

---

# 15. Tree example

Suppose:

```java
class TreeNode<T> {

    T value;

    List<TreeNode<T>>
            children =
            new ArrayList<>();
}
```

We may create:

```text
DepthFirstIterator
BreadthFirstIterator
```

Both traverse the same tree differently.

This is an important Iterator insight:

> Iterator doesn't just hide storage; it can also encapsulate traversal strategy.

---

# 16. Depth-first iterator

Conceptually:

```java
class DepthFirstIterator<T>
        implements Iterator<T> {

    private final Deque<TreeNode<T>>
            stack =
            new ArrayDeque<>();

    public DepthFirstIterator(
            TreeNode<T> root) {

        stack.push(root);
    }

    @Override
    public boolean hasNext() {

        return !stack.isEmpty();
    }

    @Override
    public T next() {

        if (!hasNext()) {
            throw new
                NoSuchElementException();
        }

        TreeNode<T> node =
                stack.pop();

        List<TreeNode<T>>
                children =
                node.children;

        for (int i =
                children.size() - 1;
                i >= 0;
                i--) {

            stack.push(
                children.get(i)
            );
        }

        return node.value;
    }
}
```

Traversal state is contained inside the Iterator.

---

# 17. Breadth-first iterator

Breadth-first traversal instead uses a queue.

```java
class BreadthFirstIterator<T>
        implements Iterator<T> {

    private final Queue<TreeNode<T>>
            queue =
            new ArrayDeque<>();

    public BreadthFirstIterator(
            TreeNode<T> root) {

        queue.add(root);
    }

    @Override
    public boolean hasNext() {

        return !queue.isEmpty();
    }

    @Override
    public T next() {

        if (!hasNext()) {
            throw new
                NoSuchElementException();
        }

        TreeNode<T> node =
                queue.remove();

        queue.addAll(
            node.children
        );

        return node.value;
    }
}
```

Same structure.

Different traversal.

---

# 18. Iterator stores traversal state

Notice:

```java
position
```

or:

```java
stack
```

or:

```java
queue
```

is stored inside the Iterator.

That means two clients can traverse the same collection independently.

For example:

```java
Iterator<Song> a =
        playlist.iterator();

Iterator<Song> b =
        playlist.iterator();
```

`a` and `b` each maintain their own position.

This is an important reason traversal state doesn't belong directly in the collection.

---

# 19. Bad design: collection owns current position

Imagine:

```java
class Playlist {

    private int currentPosition;

    public Song next() {
        return songs[
            currentPosition++
        ];
    }
}
```

Now what happens if two callers iterate at the same time?

```text
Caller A moves position.
Caller B unexpectedly sees changed position.
```

Traversal state is shared.

That's bad.

Iterator fixes this by giving each traversal its own state object.

---

# 20. External vs internal iteration

Iterator usually represents **external iteration**.

The caller controls traversal:

```java
while (iterator.hasNext()) {
    process(iterator.next());
}
```

The caller decides:

```text
when to continue
when to stop
what to do with each element
```

---

# 21. Internal iteration

Internal iteration means the collection controls traversal.

For example:

```java
playlist.forEach(
    song ->
        System.out.println(
            song.getTitle()
        )
);
```

Here the collection/framework controls iteration.

Another example:

```java
stream.forEach(...)
```

So:

```text
Iterator
→ external iteration

forEach / streams
→ usually internal iteration
```

---

# 22. Why external iteration can be useful

With explicit Iterator:

```java
while (iterator.hasNext()) {

    Song song =
            iterator.next();

    if (shouldStop(song)) {
        break;
    }
}
```

The caller has direct control.

This is useful for:

```text
pausing
stopping
interleaving traversals
manual state control
```

---

# 23. Lazy traversal

One of Iterator's most powerful capabilities is **laziness**.

Suppose producing each element is expensive.

Instead of building:

```java
List<Result> results =
        calculateEverything();
```

you might calculate elements only when:

```java
next()
```

is called.

Conceptually:

```text
Client asks for one element
→ Iterator computes one element

Client asks again
→ Iterator computes next
```

This can save:

```text
memory
computation
I/O
```

---

# 24. Infinite iterators

An Iterator can theoretically represent an infinite sequence.

For example:

```java
class NaturalNumberIterator
        implements Iterator<Long> {

    private long current = 0;

    @Override
    public boolean hasNext() {
        return true;
    }

    @Override
    public Long next() {
        return current++;
    }
}
```

There is no collection containing every natural number.

The Iterator generates them lazily.

This shows an important concept:

> Iterators don't necessarily need all elements to already exist in memory.

---

# 25. Database cursor analogy

Imagine a database query with ten million rows.

It may be undesirable to load:

```text
10,000,000 rows
```

into memory at once.

A cursor-like API might behave conceptually like:

```java
while (cursor.hasNext()) {

    Row row =
            cursor.next();
}
```

Rows can be fetched progressively.

This is Iterator-style traversal.

Real database APIs have additional resource-management concerns, but the conceptual connection is strong.

---

# 26. Pagination as Iterator-style thinking

Suppose an API returns:

```text
Page 1
Page 2
Page 3
...
```

You could wrap pagination behind:

```java
Iterator<Item>
```

The iterator could:

```text
consume current page
fetch next page when necessary
continue returning items
```

Then client code doesn't need to know pagination details.

Conceptually:

```java
while (iterator.hasNext()) {
    process(iterator.next());
}
```

while internally:

```text
page 1 exhausted
→ fetch page 2
```

Very useful abstraction.

---

# 27. Iterator + Composite

Remember Composite?

```text
Folder
├── File
├── Folder
│   ├── File
│   └── File
└── File
```

Composite represents a tree.

Iterator can traverse that tree.

For example:

```text
Composite
→ represents hierarchy

Iterator
→ traverses hierarchy
```

These patterns work together extremely well.

---

# 28. File-system example

Suppose:

```java
interface FileSystemNode {

    String getName();
}
```

with:

```text
File
Folder
```

A folder structure might expose:

```java
Iterator<FileSystemNode>
```

that traverses recursively.

Then clients don't need to manually write recursion.

They simply iterate.

---

# 29. Iterator vs Visitor

This distinction is important.

Iterator answers:

> How do I move through the object structure?

Visitor answers:

> What operation do I perform on each type of object in that structure?

For example:

```text
Iterator
→ walk through syntax tree

Visitor
→ calculate type information
→ generate code
→ pretty-print nodes
```

So:

```text
Iterator = traversal

Visitor = operation
```

They can work together.

---

# 30. Iterator vs Composite

Composite:

> How do I model a tree of individual and grouped objects?

Iterator:

> How do I traverse them?

So:

```text
Composite
= structure

Iterator
= traversal
```

Another useful distinction.

---

# 31. Iterator vs Strategy

Different traversal algorithms can look Strategy-like.

For example:

```text
DFS
BFS
```

could be represented as traversal strategies.

But Iterator specifically packages:

```text
traversal state
+
next-element access
```

such as:

```java
hasNext();
next();
```

Strategy usually represents a complete interchangeable algorithm rather than incremental traversal state.

---

# 32. Iterator vs Stream

Java Streams and Iterators overlap but are not the same.

Iterator is fundamentally:

```text
pull one element at a time
```

Example:

```java
iterator.next();
```

Stream is a higher-level data-processing abstraction supporting operations such as:

```text
filter
map
reduce
sorted
distinct
```

Example:

```java
playlist.stream()
        .filter(...)
        .map(...)
        .forEach(...);
```

A Stream may use iteration internally, but the abstraction is different.

---

# 33. Iterator is stateful

An Iterator changes as you consume it.

```java
Iterator<Song> iterator =
        playlist.iterator();
```

After:

```java
iterator.next();
iterator.next();
```

it has moved forward.

That's important.

An Iterator usually isn't reusable from the beginning.

If you want another traversal:

```java
Iterator<Song> another =
        playlist.iterator();
```

create another iterator.

---

# 34. Iterators are often single-use

You generally should not expect:

```java
iterator
```

to automatically reset.

Java's `Iterator` has no:

```java
reset()
```

method.

Why?

Because some iteration sources cannot easily reset.

For example:

```text
network stream
database cursor
generated sequence
```

A new iterator is usually cleaner.

---

# 35. `remove()` in Java Iterator

Java's Iterator also historically supports:

```java
iterator.remove();
```

This removes the last element returned by:

```java
next()
```

when the iterator implementation supports it.

Example:

```java
Iterator<String> iterator =
        names.iterator();

while (iterator.hasNext()) {

    String name =
            iterator.next();

    if (name.isBlank()) {

        iterator.remove();
    }
}
```

This is safer than directly mutating some collections during iteration.

---

# 36. Unsupported `remove()`

Not every Iterator supports removal.

An implementation can throw:

```java
UnsupportedOperationException
```

for `remove()`.

In modern Java APIs, many iterators are intentionally read-only.

So don't assume removal is always available.

---

# 37. Concurrent modification problem

Consider:

```java
List<String> names =
        new ArrayList<>();

names.add("A");
names.add("B");
names.add("C");
```

Then:

```java
for (String name : names) {

    if (name.equals("B")) {
        names.remove(name);
    }
}
```

This may throw:

```text
ConcurrentModificationException
```

Why?

Because the collection was structurally modified outside the iterator while iteration was happening.

---

# 38. Fail-fast iterators

Many Java collection iterators are **fail-fast**.

Conceptually, the iterator remembers:

```text
expected modification count
```

The collection tracks:

```text
actual modification count
```

If they don't match:

```text
collection changed unexpectedly
```

the Iterator throws:

```java
ConcurrentModificationException
```

This helps detect bugs rather than continue with unpredictable traversal.

---

# 39. Important nuance about fail-fast

Fail-fast behavior should be treated as a bug-detection mechanism, not as concurrency synchronization.

It does **not** make collections thread-safe.

For concurrent use, you may need:

```text
ConcurrentHashMap
CopyOnWriteArrayList
locking
immutable snapshots
```

depending on requirements.

---

# 40. Safe removal while iterating

Instead of:

```java
names.remove(name);
```

you may do:

```java
Iterator<String> iterator =
        names.iterator();

while (iterator.hasNext()) {

    String name =
            iterator.next();

    if (name.equals("B")) {
        iterator.remove();
    }
}
```

if that iterator supports removal.

Because the Iterator itself knows about the structural modification.

---

# 41. Snapshot iteration

Another strategy is to iterate over a snapshot.

```java
for (Song song :
        List.copyOf(songs)) {

    ...
}
```

Now modifications to the original collection don't change the current snapshot traversal.

This trades memory for simpler iteration semantics.

---

# 42. Concurrent collections may have different iterator semantics

Some concurrent collections intentionally do not use classic fail-fast semantics.

Their iterators may be:

```text
weakly consistent
snapshot-based
```

For example, the iterator might tolerate concurrent changes without throwing but not necessarily reflect every update.

The important design lesson:

> Iterator semantics are part of the collection contract.

---

# 43. Custom iterator over a range

Let's create:

```java
class Range
        implements Iterable<Integer> {

    private final int start;
    private final int end;

    public Range(
            int start,
            int end) {

        this.start = start;
        this.end = end;
    }

    @Override
    public Iterator<Integer>
            iterator() {

        return new Iterator<>() {

            private int current =
                    start;

            @Override
            public boolean hasNext() {

                return current < end;
            }

            @Override
            public Integer next() {

                if (!hasNext()) {

                    throw new
                        NoSuchElementException();
                }

                return current++;
            }
        };
    }
}
```

Usage:

```java
for (int value :
        new Range(1, 5)) {

    System.out.println(value);
}
```

Output:

```text
1
2
3
4
```

Notice no list is stored.

Values are generated lazily.

---

# 44. Iterator can filter elements

Suppose we want only active users.

A filtering iterator can wrap another iterator.

Conceptually:

```java
class FilteringIterator<T>
        implements Iterator<T> {

    private final Iterator<T>
            source;

    private final Predicate<T>
            predicate;
}
```

It repeatedly asks the source for values until one satisfies the predicate.

This starts resembling Stream operations.

---

# 45. Iterator decorators

You can even compose iterator behavior.

For example:

```text
SourceIterator
    ↓
FilteringIterator
    ↓
MappingIterator
```

Then:

```text
Iterator itself can participate
in Decorator-like structures.
```

Again, patterns combine.

---

# 46. Iterator and lazy transformations

Imagine:

```java
Iterator<User>
```

wrapped into:

```java
Iterator<String>
```

that returns user names.

Each call to:

```java
next()
```

fetches one user and transforms it.

No need to build a full transformed collection first.

This is an important foundation of lazy data processing.

---

# 47. Custom reverse iterator

Suppose:

```java
class Playlist {

    ...
}
```

provides:

```java
Iterator<Song> reverseIterator();
```

Implementation:

```java
class ReversePlaylistIterator
        implements Iterator<Song> {

    private final Song[] songs;

    private int position;

    ReversePlaylistIterator(
            Song[] songs,
            int size) {

        this.songs = songs;
        this.position =
            size - 1;
    }

    @Override
    public boolean hasNext() {

        return position >= 0;
    }

    @Override
    public Song next() {

        if (!hasNext()) {

            throw new
                NoSuchElementException();
        }

        return songs[
            position--
        ];
    }
}
```

Same collection, different traversal.

---

# 48. Binary tree inorder iterator

For a binary search tree:

```text
        4
       / \
      2   6
     / \ / \
    1  3 5  7
```

Inorder traversal should return:

```text
1 2 3 4 5 6 7
```

Instead of recursively generating a whole list, an Iterator can maintain a stack and produce one node at a time.

This is a common coding-interview application of Iterator-like thinking.

---

# 49. Lazy inorder traversal idea

The Iterator stores:

```java
Deque<TreeNode>
        stack;
```

Initially push the entire left path.

Each `next()`:

```text
1. pop top node
2. remember its value
3. if it has a right child:
   push that child's left path
4. return value
```

This gives:

```text
O(h)
```

memory, where `h` is tree height, rather than necessarily materializing all `n` elements.

Very useful.

---

# 50. Iterator can hide complexity

Client:

```java
while (iterator.hasNext()) {

    Node node =
            iterator.next();
}
```

Internally, the Iterator might be doing:

```text
recursion simulation
pagination
network calls
database fetches
tree traversal
filtering
buffering
```

The client sees none of it.

That's abstraction at work.

---

# 51. Iterator and SRP

Without Iterator, a collection may be responsible for:

```text
storage
forward traversal
reverse traversal
DFS traversal
BFS traversal
filtering traversal
```

With Iterator:

```text
Collection
→ stores structure

Iterator
→ handles traversal
```

Cleaner separation of responsibility.

---

# 52. Iterator and OCP

Suppose we add:

```text
ReverseIterator
DepthFirstIterator
FilteredIterator
```

We can add traversal styles without necessarily modifying client code.

Clients still depend on:

```java
Iterator<T>
```

That supports extension.

---

# 53. Iterator and encapsulation

A collection can change:

```text
array
```

to:

```text
linked structure
```

without changing iteration clients.

The Iterator shields clients from representation changes.

This is one of its strongest design benefits.

---

# 54. Iterator and LSP

Any `Iterator<T>` should satisfy expected Iterator behavior.

For example:

```text
hasNext()
→ tells whether next element exists

next()
→ advances exactly once
```

A bizarre iterator that skips unpredictably or resets automatically could violate caller expectations.

Contracts matter.

---

# 55. Iterator and DIP

Client code depends on:

```java
Iterator<Song>
```

rather than:

```text
PlaylistArrayInternalStorage
```

Again, client depends on an abstraction.

---

# 56. Iteration order is part of the contract

Suppose:

```java
Set<String>
```

provides an Iterator.

Does iteration order matter?

Maybe:

```text
insertion order
sorted order
undefined order
```

For example:

```text
HashSet
→ generally no defined iteration ordering contract

LinkedHashSet
→ insertion-order traversal

TreeSet
→ sorted traversal
```

So clients should rely only on ordering guarantees that the collection explicitly provides.

---

# 57. Don't accidentally expose ordering guarantees

Suppose your custom collection currently uses:

```java
ArrayList
```

and clients observe insertion order.

If ordering was never part of the contract, later switching to another data structure can surprise them.

Iterator abstraction hides representation, but behavioral contracts still matter.

---

# 58. `Iterable` can produce multiple Iterators

This is an important distinction.

`Iterable<T>` represents:

> Something that can create iterators.

`Iterator<T>` represents:

> One particular traversal in progress.

So:

```text
Iterable
→ reusable source

Iterator
→ stateful traversal
```

Example:

```java
Iterable<Song> playlist;
```

can produce:

```java
Iterator<Song> first =
        playlist.iterator();

Iterator<Song> second =
        playlist.iterator();
```

independently.

---

# 59. Iterable vs Iterator interview question

A good answer:

> `Iterable<T>` represents an object that can provide iterators through its `iterator()` method, while `Iterator<T>` represents an active traversal with methods such as `hasNext()` and `next()`. Implementing `Iterable` allows an object to be used in Java's enhanced `for` loop.

That's worth remembering.

---

# 60. Iterator vs indexing

Indexing:

```java
list.get(i);
```

assumes:

```text
position-based random access
```

Iterator:

```java
iterator.next();
```

requires only sequential traversal.

For linked lists, trees, generated values, and external streams, an index may not make sense at all.

Iterator is more general.

---

# 61. Iterator vs exposing `List`

If your API fundamentally represents:

```text
a materialized ordered collection
```

returning:

```java
List<T>
```

may be appropriate.

If your API should expose only:

```text
sequential traversal
```

or potentially lazy results, then:

```java
Iterator<T>
```

or:

```java
Iterable<T>
```

may communicate intent better.

Use the weakest abstraction that fits the need.

---

# 62. Resource-backed iterators

Suppose an iterator reads from:

```text
file
network connection
database cursor
```

Now there may be resources to close.

Plain Java `Iterator` doesn't have:

```java
close()
```

So you may need a richer abstraction:

```java
interface CloseableIterator<T>
        extends Iterator<T>,
                AutoCloseable {
}
```

Then:

```java
try (CloseableIterator<Row> it =
        repository.scan()) {

    while (it.hasNext()) {
        ...
    }
}
```

This shows that pattern interfaces should fit real lifecycle requirements.

---

# 63. Iterator and side effects

Ideally:

```java
hasNext()
```

should not unexpectedly consume an element.

Otherwise this can happen:

```java
iterator.hasNext();
iterator.hasNext();
```

and somehow skip data.

That's surprising.

The traversal contract should be predictable.

---

# 64. `next()` should advance

Normally:

```java
T item = iterator.next();
```

both:

```text
returns current element
+
advances traversal
```

If you need peeking without advancement, you may introduce:

```java
peek()
```

in a richer custom abstraction.

Don't overload Iterator semantics unpredictably.

---

# 65. Iterator invalidation

Imagine:

```text
Iterator created
```

then collection structure changes dramatically.

What happens to that Iterator?

Possible designs:

```text
fail fast
continue weakly consistently
iterate snapshot
become invalid
```

The answer depends on the collection.

This is part of designing robust iterator contracts.

---

# 66. Common mistake — returning internal mutable array

Bad:

```java
public Song[] getSongs() {

    return songs;
}
```

Caller can do:

```java
playlist.getSongs()[0] =
        null;
```

Now internal state has been modified externally.

Iterator avoids exposing that representation.

---

# 67. Common mistake — `next()` returns `null` at the end

Bad:

```java
public Song next() {

    if (!hasNext()) {
        return null;
    }

    ...
}
```

Why is this problematic?

Because `null` might itself be a valid element.

The standard Iterator contract uses:

```java
NoSuchElementException
```

Keep failure semantics unambiguous.

---

# 68. Common mistake — collection itself is the iterator

Sometimes beginners write:

```java
class Playlist
        implements Iterator<Song> {
}
```

This can work technically.

But it usually means the collection owns traversal state.

Then two callers can't traverse independently.

Prefer:

```text
Playlist
→ Iterable

PlaylistIterator
→ Iterator
```

unless there's a very specific reason otherwise.

---

# 69. Common mistake — one shared Iterator instance

Bad:

```java
class Playlist {

    private final Iterator<Song>
            iterator = ...;

    public Iterator<Song>
            iterator() {

        return iterator;
    }
}
```

Now every caller receives the same traversal state.

Instead:

```java
public Iterator<Song>
        iterator() {

    return new PlaylistIterator(...);
}
```

A fresh iterator per traversal is usually expected.

---

# 70. Common mistake — modifying collection unexpectedly

Suppose an Iterator is halfway through:

```text
A B [C] D E
```

and someone inserts new elements.

What should happen?

If undefined, bugs become subtle.

Use the underlying collection's documented semantics or design explicit behavior.

---

# 71. Common mistake — Iterator for trivial single object

Don't create:

```text
UserIterator
```

for an object containing exactly one user unless the API genuinely needs collection-like traversal.

Patterns should solve actual design problems.

---

# 72. Recognition clues

Think Iterator when requirements say:

```text
"We need to traverse elements
without exposing internal storage."

"The underlying collection may change."

"We want multiple traversal strategies."

"Traversal should be lazy."

"We need independent traversal state."

"We want custom objects to work
with for-each loops."

"We want to hide tree/database/pagination
traversal complexity."
```

The strongest recognition question is:

> **Do clients need sequential access to elements without knowing how those elements are stored or retrieved?**

If yes, Iterator is a strong candidate.

---

# 73. Interview answer

If asked:

> What is the Iterator Pattern?

A strong answer is:

> Iterator is a behavioral design pattern that provides sequential access to elements of a collection without exposing the collection's underlying representation. Traversal state is encapsulated inside an iterator object, typically through operations such as `hasNext()` and `next()`.

Then mention Java:

> In Java, `Iterator<T>` represents a traversal and `Iterable<T>` represents an object that can create iterators, which is what allows enhanced `for` loops to work.

---

# 74. Java interview answer: `Iterable` vs `Iterator`

Remember:

```text
Iterable
→ can create traversal

Iterator
→ traversal in progress
```

Code:

```java
interface Iterable<T> {

    Iterator<T> iterator();
}
```

and:

```java
interface Iterator<T> {

    boolean hasNext();

    T next();
}
```

Very common Java interview topic.

---

# 75. Iterator vs Composite interview answer

> Composite models hierarchical part-whole structures, while Iterator provides a way to traverse those structures without exposing how traversal works. A Composite tree can expose DFS or BFS iterators.

Memory shortcut:

```text
Composite = tree structure

Iterator = walk the tree
```

---

# 76. Iterator vs Visitor interview answer

> Iterator controls how elements are traversed, while Visitor encapsulates an operation performed across elements, often when different concrete element types require different behavior.

Memory shortcut:

```text
Iterator = HOW to visit elements

Visitor = WHAT to do when visiting
```

We'll study Visitor later.

---

# 77. Iterator vs Stream interview answer

> Iterator is a stateful pull-based traversal abstraction, while Stream is a higher-level pipeline abstraction for transformations and aggregation such as filter, map, and reduce. Streams may use iterators internally but provide a different programming model.

---

# 78. Mental model

Remember:

```text
Collection
   |
   | creates
   v
Iterator
   |
   | controls traversal
   v
Element
Element
Element
```

The collection says:

> Here is a way to traverse me.

The Iterator says:

> I know where we currently are and how to reach the next element.

The client says:

> I don't care how you're storing everything. Just give me the next value.

That's Iterator.

---

# Behavioral patterns so far

We've now covered:

```text
Strategy
→ interchangeable algorithms

Observer
→ notify listeners

Command
→ package actions

State
→ lifecycle-dependent behavior

Template Method
→ fixed algorithm skeleton

Chain of Responsibility
→ request-processing chain

Iterator
→ traverse without exposing representation
```

A compact mental model:

```text
Strategy        = choose behavior

Observer        = notify

Command         = action object

State           = lifecycle

Template Method = fixed workflow

Chain           = processing pipeline

Iterator        = traversal
```

# Next: Lesson 26 — Mediator Pattern

Imagine a UI form containing:

```text
TextBox
Checkbox
SubmitButton
Dropdown
ValidationLabel
```

Without Mediator, components may directly talk to each other:

```text
TextBox → SubmitButton
TextBox → ValidationLabel
Checkbox → Dropdown
Dropdown → SubmitButton
SubmitButton → everything
```

Soon you get a web of dependencies:

```text
A ↔ B
A ↔ C
B ↔ D
C ↔ D
```

Mediator introduces a central coordination object:

```text
Component A
    \
     \
    Mediator
     /   \
    /     \
Component B
Component C
```

Components communicate through the Mediator instead of knowing about one another directly.

**Lesson 26 — Mediator Pattern** will cover UI coordination, chat rooms, air-traffic-control examples, Mediator vs Observer, Mediator vs Facade, avoiding the "God Mediator" problem, and how Mediator reduces many-to-many coupling.
