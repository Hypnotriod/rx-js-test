import { bindCallback, from, generate, iif, Observable, Subject, of, range, interval } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concatAll, filter, map, mergeMap, reduce, scan, take, switchMap, delay, concatMap } from 'rxjs/operators';
import { eachValueFrom } from 'rxjs-for-await';
import XMLHttpRequest from 'xhr2';
global.XMLHttpRequest = XMLHttpRequest;

const count = (from, to) => new Observable(subscriber => {
    while (from !== to) {
        subscriber.next(from);
        from += from < to ? 1 : -1;
    }
    subscriber.complete();
});

count(5, -1).subscribe(n => console.log(`count: ${n}`));
console.log('');

// generate(10, n => n <= 20, n => n + 1).subscribe(n => console.log(`generate: ${n}`));
generate({
    initialState: 10,
    condition: n => n < 20,
    iterate: n => n + 1,
}).subscribe(n => console.log(`generate: ${n}`));
console.log('');

from(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
    .pipe(
        filter(d => d !== 'Sunday'),
        map(d => `Day: ${d}`))
    .subscribe({
        next: console.log,
        complete: () => console.log('No days left'),
    });
console.log('');

const subject = new Subject();
subject.subscribe(v => console.log('Subscription a', v));
subject.subscribe(v => console.log('Subscription b', v));
[1, 2, 3].forEach(v => subject.next(v));
console.log('');

// https://stackoverflow.com/questions/14650360/very-simple-prime-number-test-i-think-im-not-understanding-the-for-loop
const isPrime = (n) => {
    if (n > 2 && (n & 1) === 0) {
        return false;
    }
    for (let i = 3; i * i <= n; i += 2) {
        if (n % i === 0) {
            return false;
        }
    }
    return true;
};

range(2, Number.MAX_SAFE_INTEGER).pipe(
    filter(isPrime),
    take(20),
    scan((acc, v) => ({ i: acc.i + 1, v }), { i: 0, v: 0 }),
).subscribe(v => console.log('Prime#', v.i, '=', v.v));
console.log('');

of(100).pipe(
    switchMap(v => interval(v)),
    take(6),
    reduce((acc, v) => acc + v),
).subscribe({
    next: v => console.log(`switchMap: ${v}`),
    complete: () => console.log(''),
});

ajax.getJSON('https://api.github.com/users?per_page=10')
    .pipe(
        concatAll(), // mergeMap(v => v),
        map(v => `Name: ${v.login}, id: ${v.id}`))
    .subscribe({
        next: console.log,
        complete: () => console.log(''),
        error: e => console.log(`ajax.getJSON error: ${e}`),
    });

const multiplyByItselfWithCallback = (value, callback) => setTimeout(() => callback(value * value), 1000);
const multiplyByItselfWithPromise = value => new Promise(resolve => setTimeout(() => resolve(value * value), 1000));
from([0, 2, 3, undefined, undefined])
    .pipe(
        mergeMap(v => iif(() => (v === 0 || v), of(v), of(98, 99))),
        mergeMap(v => bindCallback(multiplyByItselfWithCallback)(v)),
        mergeMap(v => from(multiplyByItselfWithPromise(v))),
    ).subscribe({
        next: console.log,
        complete: () => console.log(''),
    });

async function asyncAction() {
    const stream$ = of(1000, 1200, 1300).pipe(
        concatMap(t => of(t).pipe(delay(t))), // concatMap will emit values one by one
    );
    for await (const value of eachValueFrom(stream$)) {
        console.log(`asyncAction after ${value} ms\n`);
    }
}
asyncAction();
