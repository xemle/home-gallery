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
    })
  });
})(j);