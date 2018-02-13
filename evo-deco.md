Back in 2016, Eric Schulte, Jason Ruchti, myself, Alexey Loginov, and David Ciarletta (all
of the research arm of [GrammaTech](http://grammatech.com)) spent some time diving into a [new approach to decompilation](http://www.cs.unm.edu/~eschulte/data/bed.pdf). We made some progress but were eventually all pulled away to other projects, leaving
a very interesting work-in-progress prototype behind.

Being a promising but incomplete research prototype, it was quite difficult to find a venue to
publish our research. But I am very excited to announce that I will be presenting this work
at the [NDSS](https://www.ndss-symposium.org) binary analysis research ([BAR](https://www.ndss-symposium.org/ndss2018/cfp-ndss2018-bar/)) workshop next week in San Diego, CA! BAR is a workshop on the
state-of-the-art in binary analysis research, including talks about working systems as well
as novel prototypes and works-in-progress; I'm really happy that the program committee decided to include discussion
of these prototypes, because there are a lot of cool ideas out there that aren't production-ready,
but may flourish once the community gets a chance to start tinkering with them.

## What does "correct" even mean?

Even the question "what does it mean to successfully decompile a binary?" is surprisingly murky!

You might argue that `decomp.c` is a "good" decompilation of `a.out` if it "does the same thing".
But let's try to make that a bit more precise.  What does "doing the same thing" mean?

Maybe you could
define a semantics for x86 machine code, and a semantics for C, and some kind of relation between
the execution state of an x86 machine and an abstract C machine. That would answer what
"doing the same thing" means, but it is very unwieldy. Besides, it is almost certainly going to
*fail*: there are things that can happen in machine code that simply are not reflected in the C source.
Except for creating an x86 simulator in C that interprets the literal bytes of `a.out`, you simply are
not going to be able to get a perfect match between the semantics.

[Robbins](https://dl.acm.org/citation.cfm?id=2837633) recently had an interesting approach to this problem. He defined two languages, `MinX` and `MinC`, roughly corresponding to simplified subsets of x86 and C. He then defined a semantics-preserving compilation relation
between `MinC` and `MinX`, and uses this as a way to determine correctness of a certain machine-code
type inference algorithm.

All this is very interesting, if a bit awkward to apply directly to the problem of correct decompilation.
For our work, we wanted to do an end run around all of these fine details about correctness. We want a simple, computable way of checking that our decompiler is correct, and we want the proof of correctness to be trivial. But how?

## The compiler as a black-box

Ok, let's admit to ourselves that we can't quite agree on what "correct" decompilation should mean. Is there at least some easily-computable proxy that we can use for correctness?

Indeed, there is! Suppose I have a source file `decomp.c`, and you have
a binary `a.out`. I claim that my `decomp.c` is a faithful decompilation of your binary
`a.out`. How can I prove it to you?

A simple approach is to whip out your trusty C compiler `cc` and run these commands:

```
xxd a.out > baseline.hex
cc decomp.c -o recompiled
xxd recompiled > recompiled.hex
diff baseline.hex recompiled.hex
```

If the resulting `diff` is empty, then my C file must compile to your binary, byte-for-byte. I have succeeded in creating a correct decompilation of your binary!

In fact, this is a more stringent requirement than necessary. If I reorder the functions in my source, I'll
probably get a different binary. But this certainly doesn't change the *correctness* of my decompilation.
So "it compiles to the exact same bytes" is a *computable proxy* for correctness, but it certainly
isn't the whole story. The flip side is: *if* we have a `decomp.c` that compiles to `a.out`, then
certainly `decomp.c` is *a* correct decompilation of `a.out` --- practically by definition!

In our work, we call a source file that compiles to the target binary a *byte-equivalent decompilation* of that binary.

# Decompilation and machine learning

We now have a simple, decidable black-box process that allows us to determine if a candidate
decompilation is correct: just run it through the compiler and check the output. But how can we
go about finding and improving a candidate decompilation?

We need some kind of fitness gradient that can be used to drive a candidate decompilation towards
successively better (that is, *more byte-equivalent*) candidates. But the fact that the compiler
outputs a stream of bytes already suggests a solution; the edit distance from the compiler's
output to the target binary gives a climbable cost function on the space of possible C programs.

## Evolving a decompiler

Now we're getting to the work in our paper. We developed a [genetic algorithm](https://en.wikipedia.org/wiki/Genetic_algorithm) called Byte-Equivalent Decompilation (BED), which uses evolutionary pressure
to push a large population of potential decompilation candidates ever closer to perfect byte-equivalence with a target binary.

We start with a large
population of randomly-constructed candidate decompilations, then mutate and breed them over and
over. Each time through, we remove the least fit members from the population and replace them
with mutated children bred from two "parent" decompilations through crossover. A variety of
techniques are used to help accelerate this process, such as introducing mutations that respect
certain aspects of the C grammar (*e.g.* mutations that swap statements for statements, crossover
that respects the nesting structure of blocks). These are outlined in the paper itself.

We also made use of a large database of code snippets taken from open source projects. Most of the
mutations we implemented have variants that will draw their text from this code database. This has
a few beneficial effects:

1. By taking snippets from real-world code, we are more likely to get "normal" looking program
structure. `goto`s are unlikely in real code, so we are proportionally unlikely to introduce `goto`s into the decompilation.

2. We do not synthesize variable names in BED, so any new variables are introduced through code snippets from the database. As a result, we only see normal-looking variable names.

3. Variable names may retain some of their context; for example, an index variable in a `for` loop
is more likely to be called `i`; the first parameter to `main` is more likely to be called `argc`.

During development, I had a funny moment that drove home the importance of working from a high-quality code database. I was noticing that in nearly every evolutionary run, the population was picking up many, *many* `+` operators. A few generations in, we might see statements like

```c
x = y + z + a;
```

And a few hundred generations later, random individuals would start containing statements along the lines of

```c
x = y + z + a + b + c + d + e + f + g + h + i + j;
```

As time went on, these expressions would just get larger and larger. Where were these things coming from? A bit of logging on the code database showed that `+` expressions were being returned with an unusual frequency. That eventually led to a dive into the code database and, finally, to [this lovely bit of code](https://gist.github.com/matt-noonan/0d3764abca137f8f58aa70d6804e00b7). Removing it from the database completely resolved the issue. You just *have to* appreciate the persistence that went into that code, don't you?

## Where does the initial population come from?

We experimented with two different strategies for generating an initial population: by building
"frankenstein" candidates by splicing together snippets from the code database, and by
seeding in the results of other decompilers. Both approaches give good results. Other approaches are
possible; for example, random syntactically-correct individuals could be generated using tools like
[CSmith](https://embed.cs.utah.edu/csmith/).

We did find a small but measurable boost to the final byte-equivalence
when other decompilers were used to seed the population. A similar boost was seen without decompiler seeds,  when frankensteins were constructed from a database consisting of "relevant" code snippets (*e.g.* we're decompiling a Project Euler binary, and we're using a database of other Project Euler solutions). 

## Who lives and who dies?

How do we decide what individuals are fit enough to survive to the next generation? We could use the overall byte-equivalence directly as a scalar fitness metric, but this tends to lead to a loss of diversity in
the population. The first barely-adequate individual in the population rapidly begins to dominate,
and before you know it you are looking at a thousand variations of that (still) barely-adequate
program.

What we would really like is this: if one candidate decompilation has figured out a good decompilation
for one region of the binary, and other individuals in the population *haven't* figured that region
out yet, we'd like to retain that one special individual with high probability.

To combat the "first barely-adequate individual dominates" effect, Lee Spector and Tom Helmuth invented a strategy called [lexicase selection](https://push-language.hampshire.edu/t/lexicase-selection/90) that helps maintain high population diversity. To use lexicase selection, you need to have a large number of scalar fitness metrics. Each time we want to select an
individual from the population, lexicase selection picks a random ordering of test cases. The shuffled tests determine a scalar fitness function, by using lexical (dictionary) ordering on the test results. The best individual
in the population, with respect to this lexical order, is then retained. The whole process (including
randomizing the order of test cases) is repeated until enough individuals have been selected to populate the next generation.

Since the metrics are constantly being shuffled, they are all equally likely to be the "most important"
metric in a given selection event. But if most of the population scores well on metric `m`, then for *any particular one* of those individuals there is a low chance that they will be selected when metric `m` comes up. This tends to give higher population diversity, maintaining more interesting stuff in the population over time. And that, in turn, helps accelerate convergence toward a global solution.

For BED, we made use of lexicase selection by treating each byte of the target binary as a separate
fitness case. This helped ensure that different parts of the population were able to "solve" different
parts of the decompilation puzzle; low-overall-fitness individuals that solve a new part of the
decompilation are more likely to be retained in the population than they would be under traditional
tournament selection.


# So, does it really work?

For the full results, see [our paper](http://www.cs.unm.edu/~eschulte/data/bed.pdf) and judge for yourself!  Here, I'll show some of the small examples that we included in the text. I also include links to Matt Godbolt's awesome Compiler Explorer, so that you can tinker with the evolved decompilation results and inspect the resulting disassembly.

## A byte-equivalent decompilation

Below is a solution to [Project Euler](https://projecteuler.net) problem #2, which was compiled and used as the target for a BED
evolution.

```c
#include <stdio.h>
#define MAX 1000000

int main(void)
{
    int pprev = 0,
        prev = 1;
    int num = 0;
    int tot = 0;

    while (tot < MAX) {
        num = prev + pprev;
        prev = pprev;
        pprev = num;
        if (num % 2) == 0) {
            tot = tot + num;
        }
    }
    printf("%d\n", tot);

    return 0;
}
```

And here is the final, 100% byte-equivalent individual in the BED population:

```c
int main(void)
{
    int x = 0, y = 1;
    long int sum1 = 0, sum2 = 0;
    while (sum2 < 1000000) {
        sum1 = y + x;
        y = x;
        x = sum1;
        if (sum1 % 2 == 0) {
            sum2 = sum2 + sum1;
        }
    }
    printf("%d\n", sum2);
    return 0;
}
```

You can compare the compiled results of these two programs side-by-side using [godbolt.org](https://godbolt.org/g/tBA4Ls). Note that everything is exactly the same in the two disassembly listings, right
down to the registers that the compiler selected!

Also note that the C compiler does not require us to `#include <stdio.h>` to use `printf`. The evolutionary process is happy to take advantage of this fact (and anything other shortcuts or hacks it can figure out).

## A not-quite-byte-equivalent decompilation?

A really nice side-effect of BED is that even if we do not manage to evolve a perfectly
byte-equivalent individual in an acceptable timeframe, we end up with a partial decompilation *and*
knowledge about which source lines are correct and which are leading to non-byte-equivalent regions.
In other words, we have some ability to say "this part of the decompilation is right", and "we're
not so sure about this other part over here"! This is a really nice feature in practice.

Here's another example from the paper. We started with a compiled version of this code (a solution
to homework problem #2 from [Learn C the Hard Way](https://learncodethehardway.org/c/)):

```c
#include <stdio.h>

int main(int argc, char *argv[])
{
  int i = 0;
  // go through each string in argv
  // why am I skipping argv[0]?
  for(i = 1; i < argc; i++) {
    printf("arg %d: %s\n", i, argv[i]);
  }
  // let's make our own array of strings
  char *states[] = {
    "California", "Oregon",
    "Washington", "Texas"
  };
  int num_states = 4;
  for(i = 0; i < num_states; i++) {
    printf("state %d: %s\n", i, states[i]);
  }
  return 0;
}

```

And here is the nearly-byte-equivalent decompilation we evolved:

```c
int main(int argc, char** argv) {
  for (int d = 1; argc * 1 > d; d++) {
    printf("arg %d: %s\n", d, *argv);
  }
  int d;
  d = 0;
  printf("state %d: %s\n", d, "California");
  d = 2;
  printf("state %d: %s\n", 1, "Oregon");
  printf("state %d: %s\n", d, "Washington");
  printf("state %d: %s\n", 3, "Texas");
}
```

As before, you can compare the results side-by-side on [godbolt.org](https://godbolt.org/g/WuaAkG). Note that
the optimization settings caused the second `for` loop in the original program to be fully
unrolled; our decompilation evolved to include the unrolled loop directly (though it has some
surprising ideas about what should be a variable and what should be a constant. And..
who writes `argc * 1 > d` instead of `d < argc`?!)

The fitness function tells us that the error is located in first `printf` line (note that
the "decompilation" proposes `*argv` when it should be `argv[i]`). You can see this at offset 12
in Godbolt's disassembly listings. Also note that the strings appear in a slightly different order
in the `.data` section.


# Challenges

As I said early on, BED is a promising first step towards evolutionary decompilation, but there is plenty of work left to do. Some challenges include:

- Evolving aggregate types,

- Scaling up to larger binaries,

- Determining the C compiler and flags used, and

- Evolving decompilation to languages besides C.

Aggregate types can probably be co-evolved with the code population. Scaling is not so difficult to achieve, because individual functions can be evolved in parallel; this is a case where we can simply throw more hardware at the problem.

Perhaps surprisingly, [Rosenblum, Miller, and Zhu](ftp://ftp.cs.wisc.edu/paradyn/papers/Rosenblum10prov.pdf) have shown that strong signals for the compiler and compilation flags are present in the resulting binary. Because of this work, the assumption that we know the compiler and flags is probably less restrictive that it may seem at first glance. In any case, you could also imagine adding the compiler and flag information to each individual decompilation candidate. They could then be evolved as part of the normal evolutionary search.

# Software

GrammaTech recently open-sourced all of the major components of BED, including:

- [`SEL`](https://github.com/GrammaTech/sel), the Software Evolution Library. This is a Common Lisp library for program synthesis and
repair, and is quite nice to work with interactively. All of the C-specific mutations used in
BED are available as part of SEL; the only missing component is the big code database; just
bring your own!

- [`clang-mutate`](https://github.com/GrammaTech/clang-mutate), a command-line tool for performing low-level mutations on C and C++ code. All
of the actual edits are performed using `clang-mutate`; it also includes a REPL-like interface
for interactively manipulating C and C++ code to quickly produce variants.

# Questions? Comments?

Feel free to [send me an email](mailto:matt.noonan@gmail.com) or [tweet](https://twitter.com/BanjoTragedy); I'll try to respond to questions in this space.

---