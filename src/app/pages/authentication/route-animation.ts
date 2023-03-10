import {
    trigger,
    animate,
    transition,
    style,
    query
} from '@angular/animations';

/**
 * fadeAnimation describes the routing animation triggered when the user navigates through the authentication pages
 */
export const fadeAnimation = trigger('routeAnimations', [
    transition('* => *', [
        query(
            ':enter',
            [style({ opacity: 0 })],
            { optional: true }
        ),
        query(
            ':leave',
            [style({ opacity: 1 }), animate('0.1s', style({ opacity: 0 }))],
            { optional: true }
        ),
        query(
            ':enter',
            [style({ opacity: 0 }), animate('0.1s', style({ opacity: 1 }))],
            { optional: true }
        )
    ])
]);
