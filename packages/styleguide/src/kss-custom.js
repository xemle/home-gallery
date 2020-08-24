($ => {
  $(() => {
    $('[data-modal-open]').click(function() {
      const id = $(this).data('modal-open');
      $(id).addClass('-visible');
    });

    $('.modal').each(node => {
      const $modal = $(node);
      $modal.find('.button').click(() => {
        $modal.removeClass('-visible');
      })
      $modal.find('.modal__backdrop').click(() => {
        $modal.removeClass('-visible');
      })
    });

    $('.kss-modifier__example').addClass('galleryRoot').addClass('bg');

    $(document).on('keyup', e => {
      const ESC_KEY = 27;
      if (e.which == ESC_KEY) {
        $('#kss-node').removeClass('kss-fullscreen-mode');
        $('.is-fullscreen').removeClass('is-fullscreen');
      }
    });
  });
})(j);