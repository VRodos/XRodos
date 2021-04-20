/**
 * Hello World: Step 1
 *
 * Simple block, renders and saves the same content without interactivity.
 *
 * Using inline styles - no external stylesheet needed.  Not recommended
 * because all of these styles will appear in `post_content`.
 */
( function( blocks, i18n, element ) {
    var el = element.createElement;
    var __ = i18n.__;

    var blockStyle = {
        backgroundColor: '#900',
        color: '#fff',
        padding: '20px',
    };

    blocks.registerBlockType( 'vrodos/vrodos-3d-block', {
        title: 'VRodos 3D view',
        icon: 'visibility',
        category: 'layout',
        example: {},
        edit: function() {
            return el(
                'p',
                { style: blockStyle },
                'Hello World, step 1 (from the editor).'
            );
        },
        save: function() {
            return el(
                'p',
                { style: blockStyle },
                'Hello World, step 1 (from the frontend).'
            );
        },
    } );
} )( window.wp.blocks, window.wp.i18n, window.wp.element );
